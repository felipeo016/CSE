-- =====================================================================================
-- 002_seguridad.sql — Seguridad por rol en el servidor (Prompt F2, responsable: Felipe)
--
-- Ejecutar después de 001_esquema.sql. Cubre RNF-05 (el servidor rechaza lo no permitido
-- aunque se intente fuera de la app), RNF-06 (el cliente nunca recibe costo ni ganancia) y
-- RNF-13 (la ubicación de un cliente solo la ven ese cliente y el personal).
--
-- Idea general:
--   1. Permisos (GRANT): qué operaciones puede intentar el rol "authenticated" en cada tabla.
--      El rol "anon" (sin sesión) no recibe ningún permiso sobre las tablas.
--   2. RLS (Row Level Security): qué filas puede ver o cambiar cada usuario según su perfil.
--   3. Triggers de protección: qué columnas y estados puede cambiar cada rol.
--
-- Cómo distinguen los triggers una petición de la app de una función del servidor:
-- las peticiones HTTP de la app llegan con el rol de base de datos "authenticated"
-- (current_user = 'authenticated'). Las funciones RPC de 003 son SECURITY DEFINER y se ejecutan
-- como su dueño (postgres), igual que el SQL Editor; en esos casos las reglas de la app no se
-- aplican porque la función ya validó todo.
-- =====================================================================================


-- -------------------------------------------------------------------------------------
-- 1. Funciones de apoyo para las políticas
--    SECURITY DEFINER: leen perfiles sin pasar por su RLS (evita recursión infinita).
--    search_path = '' obliga a escribir public.tabla y evita que alguien suplante tablas.
-- -------------------------------------------------------------------------------------

-- Rol del usuario con sesión. Devuelve null si no hay sesión o si el perfil está inactivo,
-- así un perfil inactivo no pasa ninguna política (RF-34).
create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.rol
  from public.perfiles p
  where p.id = auth.uid()
    and p.activo;
$$;

-- true si el usuario es trabajador o administrador activo.
create or replace function public.es_personal()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.rol_actual() in ('trabajador', 'administrador'), false);
$$;

-- Ficha de cliente del usuario con sesión (solo rol cliente y perfil activo).
create or replace function public.mi_cliente_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.cliente_id
  from public.perfiles p
  where p.id = auth.uid()
    and p.activo
    and p.rol = 'cliente';
$$;

-- Tipo del cliente con sesión: 'instalador' o 'final' (null si no es cliente).
create or replace function public.mi_tipo_cliente()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select c.tipo
  from public.clientes c
  where c.id = public.mi_cliente_id();
$$;


-- -------------------------------------------------------------------------------------
-- 2. Activar RLS en TODAS las tablas. Sin una política que lo permita, no se ve ninguna fila.
-- -------------------------------------------------------------------------------------
alter table public.clientes                      enable row level security;
alter table public.perfiles                      enable row level security;
alter table public.productos                     enable row level security;
alter table public.parametros_negocio            enable row level security;
alter table public.ubicaciones                   enable row level security;
alter table public.cotizaciones                  enable row level security;
alter table public.cotizacion_lineas             enable row level security;
alter table public.cotizacion_productos_interes  enable row level security;
alter table public.pedidos                       enable row level security;
alter table public.pedido_lineas                 enable row level security;
alter table public.citas                         enable row level security;


-- -------------------------------------------------------------------------------------
-- 3. Permisos por tabla. Primero se quita todo y luego se concede solo lo necesario.
--    pedidos y pedido_lineas: solo lectura; se crean únicamente con las RPC de 003.
--    Nadie borra filas desde la app: un producto se desactiva (RF-31).
-- -------------------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select, update         on public.perfiles                     to authenticated;
grant select, insert, update on public.clientes                     to authenticated;
grant select, insert, update on public.productos                    to authenticated;
grant select                 on public.parametros_negocio           to authenticated;
grant select, insert         on public.ubicaciones                  to authenticated;
grant select, insert, update on public.cotizaciones                 to authenticated;
grant select, insert, update, delete on public.cotizacion_lineas    to authenticated;
grant select, insert         on public.cotizacion_productos_interes to authenticated;
grant select                 on public.pedidos                      to authenticated;
grant select                 on public.pedido_lineas                to authenticated;
grant select, insert, update on public.citas                        to authenticated;

-- Necesario para generar el número COT-00001 al crear una cotización.
grant usage on sequence public.cotizaciones_numero_seq to authenticated;


-- -------------------------------------------------------------------------------------
-- 4. Políticas RLS
--    (select funcion()) hace que Postgres evalúe la función una sola vez por consulta y no
--    una vez por fila (recomendación de Supabase para rendimiento).
-- -------------------------------------------------------------------------------------

-- perfiles: cada uno ve el suyo (aunque esté inactivo, para que la app pueda avisarle);
-- el administrador ve y edita todos (RF-34).
create policy perfiles_leer on public.perfiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.rol_actual()) = 'administrador');

create policy perfiles_editar on public.perfiles
  for update to authenticated
  using (
    (id = (select auth.uid()) and (select public.rol_actual()) is not null)
    or (select public.rol_actual()) = 'administrador'
  )
  with check (
    (id = (select auth.uid()) and (select public.rol_actual()) is not null)
    or (select public.rol_actual()) = 'administrador'
  );

-- clientes: el personal ve, crea y edita todos (RF-33); el cliente solo ve su ficha.
create policy clientes_leer on public.clientes
  for select to authenticated
  using ((select public.es_personal()) or id = (select public.mi_cliente_id()));

create policy clientes_crear on public.clientes
  for insert to authenticated
  with check ((select public.es_personal()));

create policy clientes_editar on public.clientes
  for update to authenticated
  using ((select public.es_personal()))
  with check ((select public.es_personal()));

-- productos: SOLO el personal. El cliente no tiene ninguna política aquí, así que la tabla
-- le devuelve cero filas: el catálogo del cliente sale de la vista productos_catalogo (RNF-06).
create policy productos_leer on public.productos
  for select to authenticated
  using ((select public.es_personal()));

create policy productos_crear on public.productos
  for insert to authenticated
  with check ((select public.es_personal()));

create policy productos_editar on public.productos
  for update to authenticated
  using ((select public.es_personal()))
  with check ((select public.es_personal()));

-- parametros_negocio: lectura para cualquier usuario autenticado. Se editan en Supabase.
create policy parametros_leer on public.parametros_negocio
  for select to authenticated
  using (true);

-- ubicaciones: el cliente ve y registra las suyas; el personal ve todas y registra a nombre
-- de cualquier cliente (RF-26, RNF-13).
create policy ubicaciones_leer on public.ubicaciones
  for select to authenticated
  using ((select public.es_personal()) or cliente_id = (select public.mi_cliente_id()));

create policy ubicaciones_crear on public.ubicaciones
  for insert to authenticated
  with check ((select public.es_personal()) or cliente_id = (select public.mi_cliente_id()));

-- cotizaciones: el cliente ve las suyas y solo puede crear solicitudes (RF-15).
-- El personal ve todas, las crea y las edita (RF-16 a RF-19). Aceptar, rechazar y marcar como
-- vista se hace solo con las RPC de 003.
create policy cotizaciones_leer on public.cotizaciones
  for select to authenticated
  using ((select public.es_personal()) or cliente_id = (select public.mi_cliente_id()));

create policy cotizaciones_crear on public.cotizaciones
  for insert to authenticated
  with check (
    (select public.es_personal())
    or (cliente_id = (select public.mi_cliente_id()) and estado = 'solicitada')
  );

create policy cotizaciones_editar on public.cotizaciones
  for update to authenticated
  using ((select public.es_personal()))
  with check ((select public.es_personal()));

-- cotizacion_lineas: se ven si se puede ver la cotización (la subconsulta también pasa por la
-- RLS de cotizaciones). Solo el personal las crea, cambia o quita.
create policy cotizacion_lineas_leer on public.cotizacion_lineas
  for select to authenticated
  using (exists (select 1 from public.cotizaciones c where c.id = cotizacion_id));

create policy cotizacion_lineas_crear on public.cotizacion_lineas
  for insert to authenticated
  with check ((select public.es_personal()));

create policy cotizacion_lineas_editar on public.cotizacion_lineas
  for update to authenticated
  using ((select public.es_personal()))
  with check ((select public.es_personal()));

create policy cotizacion_lineas_quitar on public.cotizacion_lineas
  for delete to authenticated
  using ((select public.es_personal()));

-- Productos de interés: el cliente los agrega a SU solicitud mientras está "solicitada".
create policy productos_interes_leer on public.cotizacion_productos_interes
  for select to authenticated
  using (exists (select 1 from public.cotizaciones c where c.id = cotizacion_id));

create policy productos_interes_crear on public.cotizacion_productos_interes
  for insert to authenticated
  with check (
    (select public.es_personal())
    or exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_id
        and c.cliente_id = (select public.mi_cliente_id())
        and c.estado = 'solicitada'
    )
  );

-- pedidos y sus líneas: solo lectura (el cliente los suyos, el personal todos).
create policy pedidos_leer on public.pedidos
  for select to authenticated
  using ((select public.es_personal()) or cliente_id = (select public.mi_cliente_id()));

create policy pedido_lineas_leer on public.pedido_lineas
  for select to authenticated
  using (exists (select 1 from public.pedidos pe where pe.id = pedido_id));

-- citas: el cliente ve y agenda las suyas; solo el personal cambia el estado (RF-27, RF-28).
create policy citas_leer on public.citas
  for select to authenticated
  using ((select public.es_personal()) or cliente_id = (select public.mi_cliente_id()));

create policy citas_crear on public.citas
  for insert to authenticated
  with check ((select public.es_personal()) or cliente_id = (select public.mi_cliente_id()));

create policy citas_editar on public.citas
  for update to authenticated
  using ((select public.es_personal()))
  with check ((select public.es_personal()));


-- -------------------------------------------------------------------------------------
-- 5. Triggers de protección (qué columnas y estados puede cambiar cada rol desde la app).
--    Los nombres empiezan con _10_ para que corran antes que los de cálculo (_20_) de 003:
--    Postgres ejecuta los triggers de una tabla en orden alfabético.
-- -------------------------------------------------------------------------------------

-- perfiles: el usuario solo cambia su nombre y teléfono. Solo el administrador cambia rol y
-- estado activo, y nunca los suyos (nadie cambia su propio rol).
create or replace function public.perfiles_proteger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    return new;  -- SQL Editor o función del servidor
  end if;

  if new.id <> old.id
     or new.correo <> old.correo
     or new.cliente_id is distinct from old.cliente_id then
    raise exception 'Este dato no se puede cambiar desde la app'
      using hint = 'DATOS_INVALIDOS';
  end if;

  if new.rol <> old.rol or new.activo <> old.activo then
    if public.rol_actual() is distinct from 'administrador' then
      raise exception 'Acceso no autorizado' using hint = 'ACCESO_NO_AUTORIZADO';
    end if;
    if new.id = auth.uid() then
      raise exception 'No puede cambiar su propio rol ni desactivar su propia cuenta'
        using hint = 'ACCESO_NO_AUTORIZADO';
    end if;
  end if;

  return new;
end;
$$;

create trigger perfiles_10_proteger
  before update on public.perfiles
  for each row execute function public.perfiles_proteger();


-- Siempre debe quedar al menos un administrador activo (RF-34). Se revisa después de cambiar
-- o borrar un perfil; si no queda ninguno, se deshace toda la operación.
create or replace function public.perfiles_exigir_administrador()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.rol = 'administrador' and old.activo
     and (tg_op = 'DELETE' or not (new.rol = 'administrador' and new.activo)) then
    if not exists (
      select 1 from public.perfiles p where p.rol = 'administrador' and p.activo
    ) then
      raise exception 'Debe quedar al menos un administrador activo'
        using hint = 'ULTIMO_ADMINISTRADOR';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger perfiles_exigir_administrador
  after update or delete on public.perfiles
  for each row execute function public.perfiles_exigir_administrador();


-- Cuando el cliente edita su perfil (nombre o teléfono), su ficha de cliente se actualiza igual.
create or replace function public.perfiles_sincronizar_cliente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.cliente_id is not null
     and (new.nombre is distinct from old.nombre or new.telefono is distinct from old.telefono) then
    update public.clientes
    set nombre = new.nombre,
        telefono = new.telefono
    where id = new.cliente_id;
  end if;
  return new;
end;
$$;

create trigger perfiles_sincronizar_cliente
  after update on public.perfiles
  for each row execute function public.perfiles_sincronizar_cliente();


-- clientes: el enlace con la cuenta (usuario_id) solo lo pone el trigger de registro.
create or replace function public.clientes_proteger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.usuario_id := null;          -- el trabajador crea clientes sin cuenta (RF-33)
  else
    new.usuario_id := old.usuario_id;
  end if;
  return new;
end;
$$;

create trigger clientes_10_proteger
  before insert or update on public.clientes
  for each row execute function public.clientes_proteger();


-- ubicaciones: quién la registró lo pone el servidor, no la app.
create or replace function public.ubicaciones_proteger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    new.creada_por := auth.uid();
  end if;
  return new;
end;
$$;

create trigger ubicaciones_10_proteger
  before insert on public.ubicaciones
  for each row execute function public.ubicaciones_proteger();


-- cotizaciones:
--   * El cliente solo crea solicitudes: estado "solicitada" y sin valores de dinero.
--   * El personal crea en "solicitada" o "borrador" y solo puede pasar a "borrador" o "nueva"
--     (enviar). Una cotización enviada no se edita (decisión del equipo).
--   * Vista, aceptada, rechazada y vencida solo las ponen las RPC de 003.
create or replace function public.cotizaciones_proteger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.creada_por := auth.uid();
    new.enviada_en := null;
    new.vista_en := null;
    new.respondida_en := null;
    new.vence_en := null;

    if not public.es_personal() then
      -- Solicitud del cliente (RF-15): el trabajador pondrá después los valores.
      new.estado := 'solicitada';
      new.descuento := 0;
      new.costo_servicio := null;  -- el trigger de cálculo pone la tarifa
    elsif new.estado not in ('solicitada', 'borrador') then
      raise exception 'Una cotización se crea como borrador y luego se envía'
        using hint = 'ESTADO_NO_PERMITIDO';
    end if;
    return new;
  end if;

  -- UPDATE (solo personal, por la política cotizaciones_editar)
  if old.estado not in ('solicitada', 'borrador') then
    raise exception 'Una cotización enviada no se puede editar'
      using hint = 'ESTADO_NO_PERMITIDO';
  end if;

  if new.estado not in ('borrador', 'nueva') and new.estado <> old.estado then
    raise exception 'Cambio de estado no permitido' using hint = 'ESTADO_NO_PERMITIDO';
  end if;

  -- Datos que no cambian nunca desde la app.
  new.numero := old.numero;
  new.creada_por := old.creada_por;
  new.creado_en := old.creado_en;
  new.vista_en := old.vista_en;
  new.respondida_en := old.respondida_en;
  return new;
end;
$$;

create trigger cotizaciones_10_proteger
  before insert or update on public.cotizaciones
  for each row execute function public.cotizaciones_proteger();


-- citas:
--   * Se crean siempre como "programada", con fecha de hoy en adelante, con una ubicación del
--     mismo cliente y, si tienen pedido, con un pedido del mismo cliente (RF-27, sección 5).
--   * Desde la app solo cambia el estado: Programada → Realizada o Cancelada (RF-28).
create or replace function public.citas_proteger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if current_user = 'authenticated' then
      new.estado := 'programada';
      new.creada_por := auth.uid();
    end if;

    -- Fecha de hoy en Colombia; no se aceptan fechas pasadas.
    if new.fecha < (now() at time zone 'America/Bogota')::date then
      raise exception 'La fecha de la cita no puede ser pasada' using hint = 'DATOS_INVALIDOS';
    end if;

    if not exists (
      select 1 from public.ubicaciones u
      where u.id = new.ubicacion_id and u.cliente_id = new.cliente_id
    ) then
      raise exception 'Elija una ubicación registrada del cliente' using hint = 'DATOS_INVALIDOS';
    end if;

    if new.pedido_id is not null and not exists (
      select 1 from public.pedidos pe
      where pe.id = new.pedido_id and pe.cliente_id = new.cliente_id
    ) then
      raise exception 'El pedido no pertenece al cliente' using hint = 'DATOS_INVALIDOS';
    end if;
    return new;
  end if;

  -- UPDATE
  if current_user <> 'authenticated' then
    return new;
  end if;

  if (new.cliente_id, new.tipo, new.fecha, new.franja, new.ubicacion_id, new.pedido_id,
      new.creada_por, new.creado_en)
     is distinct from
     (old.cliente_id, old.tipo, old.fecha, old.franja, old.ubicacion_id, old.pedido_id,
      old.creada_por, old.creado_en) then
    raise exception 'Solo se puede cambiar el estado de la cita' using hint = 'DATOS_INVALIDOS';
  end if;

  if new.estado <> old.estado
     and not (old.estado = 'programada' and new.estado in ('realizada', 'cancelada')) then
    raise exception 'Cambio de estado no permitido' using hint = 'ESTADO_NO_PERMITIDO';
  end if;
  return new;
end;
$$;

create trigger citas_10_proteger
  before insert or update on public.citas
  for each row execute function public.citas_proteger();


-- -------------------------------------------------------------------------------------
-- 6. Registro en Supabase Auth: al crearse un usuario se crea su ficha de cliente y su perfil
--    con rol "cliente" (autorregistro permitido, RF-02). El rol solo lo cambia un administrador.
--    La app envía nombre y teléfono en "data" al registrarse (ver el README, "Acceso al servicio HTTP").
-- -------------------------------------------------------------------------------------
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nombre     text;
  v_telefono   text;
  v_cliente_id uuid;
begin
  v_nombre := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''),
    split_part(new.email, '@', 1)  -- usuarios creados desde el panel no traen nombre
  );
  v_telefono := nullif(trim(new.raw_user_meta_data ->> 'telefono'), '');

  insert into public.clientes (nombre, telefono, correo, tipo, usuario_id)
  values (v_nombre, v_telefono, new.email, 'final', new.id)
  returning id into v_cliente_id;

  insert into public.perfiles (id, nombre, correo, telefono, rol, activo, cliente_id)
  values (new.id, v_nombre, new.email, v_telefono, 'cliente', true, v_cliente_id);

  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();


-- -------------------------------------------------------------------------------------
-- 7. Vista productos_catalogo: lo único que el cliente puede leer de los productos (RNF-06).
--    * No tiene la columna costo (ni nada para calcular ganancia).
--    * Devuelve un solo "precio": el del tipo del cliente (instalador o final). El personal
--      ve aquí el precio de cliente final; sus pantallas de gestión usan la tabla productos.
--    * Solo productos activos.
--
--    Cómo respeta la seguridad: la vista es security_invoker = true, o sea, se ejecuta con los
--    permisos de quien consulta (no con los del dueño). Como el cliente no puede leer la tabla
--    productos, la vista toma los datos de catalogo_productos(), una función SECURITY DEFINER
--    que es la única puerta de entrada: devuelve solo columnas sin costo, solo productos activos
--    y solo a usuarios con perfil activo. El rol anon no puede ejecutarla ni leer la vista.
--    Así, ningún camino le entrega el costo al cliente, y el Security Advisor de Supabase no
--    marca la vista como "Security Definer View".
-- -------------------------------------------------------------------------------------
create or replace function public.catalogo_productos()
returns table (
  id          uuid,
  codigo      text,
  nombre      text,
  descripcion text,
  marca       text,
  categoria   text,
  precio      numeric,
  tipo_precio text,
  inventario  integer,
  imagen_url  text
)
language sql
stable
security definer
set search_path = ''
as $$
  with quien as (
    select public.rol_actual() as rol, public.mi_tipo_cliente() as tipo
  )
  select
    p.id,
    p.codigo,
    p.nombre,
    p.descripcion,
    p.marca,
    p.categoria,
    case when q.tipo = 'instalador' then p.precio_instalador else p.precio_cliente_final end,
    case when q.tipo = 'instalador' then 'instalador' else 'final' end,
    p.inventario,
    p.imagen_url
  from public.productos p
  cross join quien q
  where p.activo
    and q.rol is not null;  -- sin sesión o con perfil inactivo: cero filas
$$;

create or replace view public.productos_catalogo
with (security_invoker = true)
as
  select * from public.catalogo_productos();

revoke all on public.productos_catalogo from anon, authenticated;
grant select on public.productos_catalogo to authenticated;


-- -------------------------------------------------------------------------------------
-- 8. Funciones: nadie sin sesión (anon) ejecuta funciones de este esquema.
--    Supabase concede EXECUTE a anon por defecto; aquí se le quita.
-- -------------------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on function public.rol_actual()         to authenticated;
grant execute on function public.es_personal()        to authenticated;
grant execute on function public.mi_cliente_id()      to authenticated;
grant execute on function public.mi_tipo_cliente()    to authenticated;
grant execute on function public.catalogo_productos() to authenticated;
