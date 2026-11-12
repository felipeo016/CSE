-- =====================================================================================
-- 007_borrador_oculto_cliente.sql — El cliente no ve la cotización mientras se prepara
-- (Migración 007, responsable: Felipe)
--
-- Ejecutar después de 006_borrador_cotizacion.sql.
--
-- Problema: con 002, el cliente leía sus cotizaciones directamente de la tabla, en cualquier
-- estado. Así podía ver un Borrador, con sus líneas y totales, mientras el trabajador lo
-- preparaba. La sección 5 dice que Borrador es un estado del lado del trabajador y que el cliente
-- solo ve Nueva, Vista, Aceptada, Rechazada y Vencida; RF-18 dice que la cotización llega a su
-- bandeja cuando se envía.
--
-- Qué cambia:
--   1. Tabla cotizaciones: el cliente solo lee sus cotizaciones ya enviadas (nueva, vista,
--      aceptada, rechazada o vencida). El personal sigue leyendo todas.
--   2. Tabla cotizacion_lineas: el cliente solo lee las líneas de esas cotizaciones enviadas.
--   3. Vista cotizaciones_cliente: la bandeja y el detalle del cliente. Trae TODAS sus
--      cotizaciones, pero mientras están en "solicitada" o "borrador":
--        * estado y estado_actual llegan como "solicitada" (no se expone el estado interno);
--        * subtotal, descuento, impuesto, costo_servicio, total e incluye_servicio llegan en
--          null;
--        * cotizacion_lineas llega vacía ([]).
--      Los productos de interés sí llegan siempre: los escribió el propio cliente y no tienen
--      precios.
--   4. marcar_cotizacion_vista ya no devuelve una cotización en preparación (antes la devolvía
--      tal cual, con sus totales): responde "Cotización no encontrada".
--   5. crear_solicitud_cotizacion (de 005) le devuelve al cliente solo id, numero y estado; las
--      demás columnas llegan en null (antes llegaban la tarifa del servicio y el total).
--
-- Por qué una vista security_invoker sobre una función SECURITY DEFINER (igual que
-- productos_catalogo de 002):
--   * RLS decide qué FILAS ve cada usuario, pero no puede ocultar COLUMNAS solo en algunas
--     filas. Para entregar la fila del borrador sin su dinero hace falta una consulta que arme
--     la respuesta.
--   * Cliente y personal entran con el mismo rol de base de datos (authenticated), así que no se
--     pueden quitar columnas con GRANT solo al cliente.
--   * Una vista normal (security_invoker) sobre la tabla no sirve: el cliente necesitaría leer la
--     tabla, y entonces también podría pedir el borrador directo a /rest/v1/cotizaciones.
--   * Una vista SECURITY DEFINER sí serviría, pero el Security Advisor la marca como ERROR.
--   * Por eso: la tabla queda cerrada para lo que está en preparación (punto 1) y la única
--     puerta para esas filas es cotizaciones_del_cliente(), que filtra por mi_cliente_id() y
--     anula el dinero y las líneas. La vista security_invoker solo le da a la app una ruta REST
--     cómoda (/rest/v1/cotizaciones_cliente) con filtros y orden de PostgREST.
--
-- Nada cambia para el personal: sigue leyendo la tabla cotizaciones con sus líneas y su
-- cliente. aceptar_cotizacion y rechazar_cotizacion ya rechazaban un borrador
-- (ESTADO_NO_PERMITIDO) antes de devolver nada, así que no se tocan.
-- =====================================================================================


-- -------------------------------------------------------------------------------------
-- 1. Tabla cotizaciones: el cliente solo lee lo que ya le enviaron.
-- -------------------------------------------------------------------------------------
drop policy if exists cotizaciones_leer on public.cotizaciones;

create policy cotizaciones_leer on public.cotizaciones
  for select to authenticated
  using (
    (select public.es_personal())
    or (
      cliente_id = (select public.mi_cliente_id())
      and estado in ('nueva', 'vista', 'aceptada', 'rechazada', 'vencida')
    )
  );


-- -------------------------------------------------------------------------------------
-- 2. Líneas: el personal lee todas; el cliente, solo las de sus cotizaciones enviadas.
--    (La subconsulta también pasa por la RLS de cotizaciones; aquí se escribe la regla
--    completa para que se lea sin tener que recordar la otra política.)
-- -------------------------------------------------------------------------------------
drop policy if exists cotizacion_lineas_leer on public.cotizacion_lineas;

create policy cotizacion_lineas_leer on public.cotizacion_lineas
  for select to authenticated
  using (
    (select public.es_personal())
    or exists (
      select 1
      from public.cotizaciones c
      where c.id = cotizacion_id
        and c.cliente_id = (select public.mi_cliente_id())
        and c.estado in ('nueva', 'vista', 'aceptada', 'rechazada', 'vencida')
    )
  );


-- -------------------------------------------------------------------------------------
-- 3. Función cotizaciones_del_cliente(): todas las cotizaciones del cliente con sesión.
--    SECURITY DEFINER para poder leer también las que están en preparación, que la tabla ya
--    no le entrega. Por eso valida adentro: solo filas de mi_cliente_id() (null para el
--    personal o un perfil inactivo = cero filas) y, en preparación, sin dinero ni líneas.
--    Las líneas y los productos de interés van como listas JSON con los mismos campos que la
--    app ya recibía, así la forma de la respuesta no cambia.
-- -------------------------------------------------------------------------------------
create or replace function public.cotizaciones_del_cliente()
returns table (
  id                           uuid,
  numero                       text,
  tipo_servicio                text,
  descripcion_necesidad        text,
  estado                       text,
  estado_actual                text,
  descuento                    numeric,
  incluye_servicio             boolean,
  costo_servicio               numeric,
  subtotal                     numeric,
  impuesto                     numeric,
  total                        numeric,
  vence_en                     timestamptz,
  enviada_en                   timestamptz,
  vista_en                     timestamptz,
  respondida_en                timestamptz,
  creado_en                    timestamptz,
  cotizacion_lineas            jsonb,
  cotizacion_productos_interes jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.numero,
    c.tipo_servicio,
    c.descripcion_necesidad,
    -- En preparación el cliente ve "solicitada": no se expone si ya es un borrador.
    case when p.en_preparacion then 'solicitada' else c.estado end,
    case when p.en_preparacion then 'solicitada' else public.estado_actual(c) end,
    -- Dinero: null mientras se prepara (la app lo muestra como "Por cotizar").
    case when p.en_preparacion then null else c.descuento end,
    -- También null: si el trabajador lo cambia, el cliente sabría que ya hay un borrador.
    case when p.en_preparacion then null else c.incluye_servicio end,
    case when p.en_preparacion then null else c.costo_servicio end,
    case when p.en_preparacion then null else c.subtotal end,
    case when p.en_preparacion then null else c.impuesto end,
    case when p.en_preparacion then null else c.total end,
    c.vence_en,
    c.enviada_en,
    c.vista_en,
    c.respondida_en,
    c.creado_en,
    -- Líneas: vacías mientras se prepara; enviadas, ordenadas por nombre.
    case
      when p.en_preparacion then '[]'::jsonb
      else coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', l.id,
                 'producto_id', l.producto_id,
                 'codigo_producto', l.codigo_producto,
                 'nombre_producto', l.nombre_producto,
                 'precio_unitario', l.precio_unitario,
                 'cantidad', l.cantidad,
                 'subtotal', l.subtotal)
               order by l.nombre_producto)
        from public.cotizacion_lineas l
        where l.cotizacion_id = c.id
      ), '[]'::jsonb)
    end,
    -- Productos de interés: los indicó el propio cliente al solicitar; no tienen precios.
    coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', pi.id,
               'producto_id', pi.producto_id,
               'nombre_producto', pi.nombre_producto,
               'cantidad', pi.cantidad)
             order by pi.nombre_producto)
      from public.cotizacion_productos_interes pi
      where pi.cotizacion_id = c.id
    ), '[]'::jsonb)
  from public.cotizaciones c
  cross join lateral (
    select c.estado in ('solicitada', 'borrador') as en_preparacion
  ) p
  where c.cliente_id = public.mi_cliente_id();
$$;

-- Vista con permisos de quien consulta (no la marca el Security Advisor). El cliente la pide
-- como GET /rest/v1/cotizaciones_cliente?select=...&order=creado_en.desc
create or replace view public.cotizaciones_cliente
with (security_invoker = true)
as
  select * from public.cotizaciones_del_cliente();


-- -------------------------------------------------------------------------------------
-- 4. marcar_cotizacion_vista: igual que en 003, pero una cotización en preparación
--    (solicitada o borrador) responde "Cotización no encontrada" en vez de devolverse con sus
--    totales. La app solo la llama al abrir una Nueva, así que no cambia nada en pantalla.
-- -------------------------------------------------------------------------------------
create or replace function public.marcar_cotizacion_vista(id uuid)
returns public.cotizaciones
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id         uuid := id;
  v_cliente_id uuid := public.mi_cliente_id();
  v_cotizacion public.cotizaciones;
begin
  if v_cliente_id is null then
    raise exception 'Acceso no autorizado' using hint = 'ACCESO_NO_AUTORIZADO';
  end if;

  select * into v_cotizacion
  from public.cotizaciones c
  where c.id = v_id and c.cliente_id = v_cliente_id
  for update;

  -- Nuevo en 007: para el cliente, una cotización en preparación todavía no existe.
  if not found or v_cotizacion.estado in ('solicitada', 'borrador') then
    raise exception 'Cotización no encontrada' using hint = 'COTIZACION_NO_ENCONTRADA';
  end if;

  if v_cotizacion.estado in ('nueva', 'vista') and v_cotizacion.vence_en < now() then
    update public.cotizaciones
    set estado = 'vencida'
    where cotizaciones.id = v_id
    returning * into v_cotizacion;
  elsif v_cotizacion.estado = 'nueva' then
    update public.cotizaciones
    set estado = 'vista',
        vista_en = now()
    where cotizaciones.id = v_id
    returning * into v_cotizacion;
  end if;
  -- Aceptada, rechazada o vencida: no cambia nada y se devuelve como está.

  return v_cotizacion;
end;
$$;


-- -------------------------------------------------------------------------------------
-- 5. crear_solicitud_cotizacion: igual que en 005 (mismas validaciones y misma transacción),
--    pero al final solo devuelve id, numero y estado. La app solo usa esos tres campos: la
--    pantalla Solicitar cotización muestra "Tu solicitud COT-… quedó en estado Solicitada".
--    Por qué las demás columnas van en null y no se quitan: "create or replace" no puede cambiar
--    el tipo que devuelve una función (sigue siendo public.cotizaciones). Cambiarlo obligaría a
--    borrarla y crearla otra vez; así la llamada y la forma de la respuesta no cambian.
-- -------------------------------------------------------------------------------------
create or replace function public.crear_solicitud_cotizacion(
  tipo_servicio     text,
  descripcion       text,
  productos_interes jsonb default '[]'::jsonb
)
returns public.cotizaciones
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Copias de los parámetros con prefijo v_ para no confundirlos con columnas.
  v_tipo_servicio text  := tipo_servicio;
  v_descripcion   text  := trim(coalesce(descripcion, ''));
  v_productos     jsonb := coalesce(productos_interes, '[]'::jsonb);
  v_cliente_id    uuid  := public.mi_cliente_id();
  v_elemento      jsonb;
  v_cotizacion    public.cotizaciones;
  v_respuesta     public.cotizaciones;  -- lo que recibe el cliente: solo id, numero y estado
begin
  -- Solo un cliente activo (igual que la política cotizaciones_crear de 002).
  if v_cliente_id is null then
    raise exception 'Acceso no autorizado' using hint = 'ACCESO_NO_AUTORIZADO';
  end if;

  -- Validaciones de los datos recibidos (mensaje por campo en la app; aquí, la última defensa).
  if v_tipo_servicio is null or v_tipo_servicio not in ('instalacion', 'mantenimiento') then
    raise exception 'Elija el tipo de servicio' using hint = 'DATOS_INVALIDOS';
  end if;
  if v_descripcion = '' then
    raise exception 'Describa su necesidad' using hint = 'DATOS_INVALIDOS';
  end if;
  if jsonb_typeof(v_productos) <> 'array' then
    raise exception 'Los productos de interés no tienen un formato válido'
      using hint = 'DATOS_INVALIDOS';
  end if;

  for v_elemento in select e from jsonb_array_elements(v_productos) e loop
    -- producto_id debe ser un texto con formato uuid (así un id mal escrito no da un error raro).
    if jsonb_typeof(v_elemento -> 'producto_id') is distinct from 'string'
       or (v_elemento ->> 'producto_id') !~*
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Producto no encontrado' using hint = 'PRODUCTO_NO_ENCONTRADO';
    end if;
    -- La cantidad es opcional; si viene, entera y mayor o igual a 1.
    if v_elemento ? 'cantidad' and jsonb_typeof(v_elemento -> 'cantidad') <> 'null' then
      if jsonb_typeof(v_elemento -> 'cantidad') <> 'number'
         or (v_elemento ->> 'cantidad')::numeric < 1
         or (v_elemento ->> 'cantidad')::numeric <> trunc((v_elemento ->> 'cantidad')::numeric) then
        raise exception 'La cantidad de un producto de interés debe ser un entero mayor o igual a 1'
          using hint = 'DATOS_INVALIDOS';
      end if;
    end if;
  end loop;

  -- 1. La solicitud (costo_servicio null a propósito: el trigger de cálculo de 003 pone la tarifa).
  insert into public.cotizaciones
    (cliente_id, tipo_servicio, descripcion_necesidad, estado, descuento, costo_servicio,
     creada_por)
  values
    (v_cliente_id, v_tipo_servicio, v_descripcion, 'solicitada', 0, null, auth.uid())
  returning * into v_cotizacion;

  -- 2. Los productos de interés (mismo producto dos veces = una fila con la suma). Si uno falla,
  --    se deshace también el paso 1 y no queda la solicitud a medias.
  insert into public.cotizacion_productos_interes (cotizacion_id, producto_id, cantidad)
  select v_cotizacion.id,
         (e ->> 'producto_id')::uuid,
         sum((e ->> 'cantidad')::numeric)::integer  -- ::numeric acepta 2 y 2.0
  from jsonb_array_elements(v_productos) e
  group by (e ->> 'producto_id')::uuid;

  -- 3. Nuevo en 007: solo id, numero y estado; todo lo demás (dinero incluido) va en null.
  v_respuesta.id := v_cotizacion.id;
  v_respuesta.numero := v_cotizacion.numero;
  v_respuesta.estado := v_cotizacion.estado;
  return v_respuesta;
end;
$$;


-- -------------------------------------------------------------------------------------
-- 6. Permisos: nada para anon; la vista y las funciones solo para usuarios con sesión.
--    Supabase concede permisos a anon en todo objeto nuevo; aquí se quitan.
-- -------------------------------------------------------------------------------------
revoke all on public.cotizaciones_cliente from public, anon, authenticated;
grant select on public.cotizaciones_cliente to authenticated;

revoke execute on function public.cotizaciones_del_cliente() from public, anon;
grant execute on function public.cotizaciones_del_cliente() to authenticated;

revoke execute on function public.marcar_cotizacion_vista(uuid) from public, anon;
grant execute on function public.marcar_cotizacion_vista(uuid) to authenticated;

revoke execute on function public.crear_solicitud_cotizacion(text, text, jsonb) from public, anon;
grant execute on function public.crear_solicitud_cotizacion(text, text, jsonb) to authenticated;
