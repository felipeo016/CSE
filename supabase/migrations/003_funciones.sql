-- =====================================================================================
-- 003_funciones.sql — Cálculos, triggers de negocio y funciones RPC (Prompt F2, Felipe)
--
-- Ejecutar después de 002_seguridad.sql.
-- Las funciones RPC se llaman desde la app con Axios: POST /rest/v1/rpc/<nombre>.
-- Son transaccionales: si algo falla, no queda nada a medias (ni pedido ni inventario
-- descontado). Bloquean con FOR UPDATE las filas de productos que tocan, así dos compras
-- simultáneas de la última unidad registran solo una (RNF-15).
--
-- Errores: se lanzan con un mensaje para mostrar al usuario y un "hint" con un código fijo que
-- la app puede usar (PostgREST responde HTTP 400 con { message, hint, details, code }).
--   ACCESO_NO_AUTORIZADO, COTIZACION_NO_ENCONTRADA, COTIZACION_VENCIDA, ESTADO_NO_PERMITIDO,
--   PRODUCTO_NO_ENCONTRADO, PRODUCTO_NO_DISPONIBLE, SIN_PRECIO, INVENTARIO_INSUFICIENTE,
--   DATOS_INVALIDOS.
-- Con INVENTARIO_INSUFICIENTE, "details" trae un JSON: {"producto_id","nombre","disponibles"}.
-- =====================================================================================


-- -------------------------------------------------------------------------------------
-- 1. Cálculos compartidos (sección 5). Misma regla en carrito y cotización:
--      base       = subtotal − descuento         (nunca negativa)
--      impuesto   = base × impuesto_porcentaje / 100, redondeado a pesos enteros
--      servicio   = tarifa de instalación o mantenimiento, si se pide el servicio
--      total      = base + impuesto + servicio
--    La app (src/utils/calculos) debe usar exactamente esta fórmula y este redondeo.
-- -------------------------------------------------------------------------------------
create or replace function public.calcular_impuesto(base numeric)
returns numeric
language sql
stable
set search_path = ''
as $$
  select round(greatest(base, 0) * pn.impuesto_porcentaje / 100, 0)
  from public.parametros_negocio pn
  where pn.id = 1;
$$;

create or replace function public.tarifa_servicio(tipo_servicio text)
returns numeric
language sql
stable
set search_path = ''
as $$
  select case tipo_servicio
           when 'instalacion'   then pn.tarifa_instalacion
           when 'mantenimiento' then pn.tarifa_mantenimiento
           else 0
         end
  from public.parametros_negocio pn
  where pn.id = 1;
$$;


-- Mensaje cuando falta inventario, con los textos de la documentación (RF-10, RF-13).
create or replace function public.mensaje_inventario(nombre text, disponibles integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
           when disponibles = 0 then nombre || ': Agotado'
           else 'Solo hay ' || disponibles || ' unidades disponibles de ' || nombre
         end;
$$;


-- -------------------------------------------------------------------------------------
-- 2. Cotizaciones: totales calculados por el servidor.
--    Mientras la cotización está en preparación (solicitada o borrador) se recalcula cada vez
--    que cambia; al enviarla (estado → nueva) se valida y se fija la vigencia. Después de
--    enviada los valores quedan congelados.
-- -------------------------------------------------------------------------------------
create or replace function public.cotizaciones_calcular()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_subtotal     numeric := 0;
  v_base         numeric;
  v_lineas       integer := 0;
  v_vigencia     integer;
begin
  -- Ya enviada (o respondida): no se recalcula nada.
  if tg_op = 'UPDATE' and old.estado not in ('solicitada', 'borrador') then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(sum(l.subtotal), 0), count(*)
      into v_subtotal, v_lineas
    from public.cotizacion_lineas l
    where l.cotizacion_id = new.id;
  end if;

  new.subtotal := v_subtotal;

  -- Costo del servicio: el trabajador puede escribirlo (RF-17). Si no lo envía, o si acaba de
  -- marcar "incluye servicio", se usa la tarifa de parametros_negocio.
  if not new.incluye_servicio then
    new.costo_servicio := 0;
  elsif new.costo_servicio is null
        or (tg_op = 'UPDATE' and not old.incluye_servicio
            and new.costo_servicio = old.costo_servicio) then
    new.costo_servicio := public.tarifa_servicio(new.tipo_servicio);
  end if;

  v_base := greatest(new.subtotal - new.descuento, 0);
  new.impuesto := public.calcular_impuesto(v_base);
  new.total := v_base + new.impuesto + new.costo_servicio;

  -- Envío (RF-18): exige productos y un descuento válido; fija la vigencia.
  if new.estado = 'nueva' then
    if v_lineas = 0 then
      raise exception 'La cotización debe tener al menos un producto'
        using hint = 'DATOS_INVALIDOS';
    end if;
    if new.descuento > new.subtotal then
      raise exception 'El descuento no puede ser mayor que el subtotal'
        using hint = 'DATOS_INVALIDOS';
    end if;

    select pn.vigencia_dias into v_vigencia from public.parametros_negocio pn where pn.id = 1;
    new.enviada_en := now();
    new.vence_en := now() + make_interval(days => v_vigencia);
  end if;

  return new;
end;
$$;

create trigger cotizaciones_20_calcular
  before insert or update on public.cotizaciones
  for each row execute function public.cotizaciones_calcular();


-- Líneas de cotización: el servidor copia código, nombre y precio del producto según el tipo
-- del cliente, y valida cantidad e inventario (RF-16). Solo se cambian en preparación.
create or replace function public.cotizacion_lineas_preparar()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_cotizacion_id uuid;
  v_estado        text;
  v_tipo_cliente  text;
  v_producto      public.productos;
begin
  if tg_op = 'DELETE' then
    v_cotizacion_id := old.cotizacion_id;
  else
    v_cotizacion_id := new.cotizacion_id;
  end if;

  select c.estado, cl.tipo
    into v_estado, v_tipo_cliente
  from public.cotizaciones c
  join public.clientes cl on cl.id = c.cliente_id
  where c.id = v_cotizacion_id;

  if v_estado is null then
    raise exception 'Cotización no encontrada' using hint = 'COTIZACION_NO_ENCONTRADA';
  end if;
  if v_estado not in ('solicitada', 'borrador') then
    raise exception 'Una cotización enviada no se puede editar' using hint = 'ESTADO_NO_PERMITIDO';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if tg_op = 'UPDATE' and new.cotizacion_id <> old.cotizacion_id then
    raise exception 'Una línea no se puede mover a otra cotización' using hint = 'DATOS_INVALIDOS';
  end if;

  select * into v_producto from public.productos p where p.id = new.producto_id;
  if not found or not v_producto.activo then
    raise exception 'Producto no encontrado' using hint = 'PRODUCTO_NO_ENCONTRADO';
  end if;

  -- Copia para conservar los datos aunque el producto cambie después.
  new.codigo_producto := v_producto.codigo;
  new.nombre_producto := v_producto.nombre;
  new.precio_unitario := case when v_tipo_cliente = 'instalador'
                              then v_producto.precio_instalador
                              else v_producto.precio_cliente_final end;

  if new.precio_unitario is null then
    raise exception 'El producto % no tiene precio registrado para este tipo de cliente',
      v_producto.nombre
      using hint = 'SIN_PRECIO';
  end if;

  -- No se reserva inventario (decisión del equipo), pero no se cotiza más de lo que hay.
  if new.cantidad > v_producto.inventario then
    raise exception using
            message = public.mensaje_inventario(v_producto.nombre, v_producto.inventario),
            hint = 'INVENTARIO_INSUFICIENTE',
            detail = json_build_object('producto_id', v_producto.id,
                                       'nombre', v_producto.nombre,
                                       'disponibles', v_producto.inventario)::text;
  end if;

  return new;
end;
$$;

create trigger cotizacion_lineas_10_preparar
  before insert or update or delete on public.cotizacion_lineas
  for each row execute function public.cotizacion_lineas_preparar();


-- Cuando cambian las líneas se "toca" la cotización para que su trigger recalcule los totales.
create or replace function public.cotizacion_lineas_recalcular()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.cotizaciones
  set actualizado_en = now()
  where id = case when tg_op = 'DELETE' then old.cotizacion_id else new.cotizacion_id end;
  return null;
end;
$$;

create trigger cotizacion_lineas_20_recalcular
  after insert or update or delete on public.cotizacion_lineas
  for each row execute function public.cotizacion_lineas_recalcular();


-- Productos de interés: copia el nombre (el cliente no puede leer la tabla productos).
create or replace function public.productos_interes_preparar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select p.nombre into new.nombre_producto
  from public.productos p
  where p.id = new.producto_id and p.activo;

  if not found then
    raise exception 'Producto no encontrado' using hint = 'PRODUCTO_NO_ENCONTRADO';
  end if;
  return new;
end;
$$;

create trigger productos_interes_10_preparar
  before insert on public.cotizacion_productos_interes
  for each row execute function public.productos_interes_preparar();


-- Estado que debe mostrar la app: una cotización nueva o vista con vence_en pasado es Vencida
-- (decisión del equipo). Se pide como columna calculada: GET /cotizaciones?select=*,estado_actual
create or replace function public.estado_actual(cotizacion public.cotizaciones)
returns text
language sql
stable
set search_path = ''
as $$
  select case
           when cotizacion.estado in ('nueva', 'vista') and cotizacion.vence_en < now()
             then 'vencida'
           else cotizacion.estado
         end;
$$;


-- -------------------------------------------------------------------------------------
-- 3. RPC registrar_pedido_carrito (RF-13, RNF-15)
--    lineas: [{"producto_id": "uuid", "cantidad": 2}, ...]
--    El precio NO viene de la app: se toma del producto según el tipo del cliente.
--    Descuento 0 en el carrito (decisión del equipo). Devuelve el pedido creado.
-- -------------------------------------------------------------------------------------
create or replace function public.registrar_pedido_carrito(
  lineas           jsonb,
  incluye_servicio boolean default false,
  tipo_servicio    text default null
)
returns public.pedidos
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Copias de los parámetros con prefijo v_ para no confundirlos con columnas.
  v_lineas         jsonb   := lineas;
  v_incluye        boolean := coalesce(incluye_servicio, false);
  v_tipo_servicio  text    := tipo_servicio;
  v_cliente_id     uuid    := public.mi_cliente_id();
  v_tipo_cliente   text;
  v_elemento       jsonb;
  v_item           record;
  v_subtotal       numeric := 0;
  v_impuesto       numeric;
  v_costo_servicio numeric := 0;
  v_pedido         public.pedidos;
begin
  if v_cliente_id is null then
    raise exception 'Acceso no autorizado' using hint = 'ACCESO_NO_AUTORIZADO';
  end if;

  -- Validaciones de los datos recibidos.
  if v_lineas is null or jsonb_typeof(v_lineas) <> 'array' or jsonb_array_length(v_lineas) = 0 then
    raise exception 'El carrito está vacío' using hint = 'DATOS_INVALIDOS';
  end if;

  for v_elemento in select e from jsonb_array_elements(v_lineas) e loop
    if jsonb_typeof(v_elemento -> 'producto_id') <> 'string'
       or jsonb_typeof(v_elemento -> 'cantidad') <> 'number'
       or (v_elemento ->> 'cantidad')::numeric < 1
       or (v_elemento ->> 'cantidad')::numeric <> trunc((v_elemento ->> 'cantidad')::numeric) then
      raise exception 'Cada producto necesita una cantidad entera mayor o igual a 1'
        using hint = 'DATOS_INVALIDOS';
    end if;
  end loop;

  if v_incluye then
    if v_tipo_servicio is null or v_tipo_servicio not in ('instalacion', 'mantenimiento') then
      raise exception 'Elija el tipo de servicio' using hint = 'DATOS_INVALIDOS';
    end if;
  else
    v_tipo_servicio := null;
  end if;

  select c.tipo into v_tipo_cliente from public.clientes c where c.id = v_cliente_id;

  -- Bloquear los productos del carrito (en orden de id para evitar bloqueos cruzados).
  perform 1
  from public.productos p
  where p.id in (select (e ->> 'producto_id')::uuid from jsonb_array_elements(v_lineas) e)
  order by p.id
  for update;

  -- Se crea el pedido y luego se agregan las líneas. Si algo falla más abajo,
  -- la transacción se deshace completa y el pedido no queda registrado.
  insert into public.pedidos (cliente_id, tipo_cliente, origen, incluye_servicio, tipo_servicio)
  values (v_cliente_id, v_tipo_cliente, 'carrito', v_incluye, v_tipo_servicio)
  returning * into v_pedido;

  for v_item in
    select l.producto_id,
           l.cantidad,
           p.id as id_encontrado,
           p.codigo,
           p.nombre,
           p.inventario,
           p.activo,
           case when v_tipo_cliente = 'instalador'
                then p.precio_instalador else p.precio_cliente_final end as precio
    from (
      -- Si la app manda el mismo producto dos veces, se suman las cantidades.
      select (e ->> 'producto_id')::uuid as producto_id,
             sum((e ->> 'cantidad')::integer) as cantidad
      from jsonb_array_elements(v_lineas) e
      group by 1
    ) l
    left join public.productos p on p.id = l.producto_id
    order by l.producto_id
  loop
    if v_item.id_encontrado is null or not v_item.activo then
      raise exception 'Producto no encontrado' using hint = 'PRODUCTO_NO_ENCONTRADO';
    end if;
    if v_item.precio is null then
      raise exception 'El producto % no tiene precio registrado para este tipo de cliente',
        v_item.nombre
        using hint = 'SIN_PRECIO';
    end if;
    if v_item.cantidad > v_item.inventario then
      raise exception using
              message = public.mensaje_inventario(v_item.nombre, v_item.inventario),
              hint = 'INVENTARIO_INSUFICIENTE',
              detail = json_build_object('producto_id', v_item.producto_id,
                                         'nombre', v_item.nombre,
                                         'disponibles', v_item.inventario)::text;
    end if;

    insert into public.pedido_lineas
      (pedido_id, producto_id, codigo_producto, nombre_producto, precio_unitario, cantidad)
    values
      (v_pedido.id, v_item.producto_id, v_item.codigo, v_item.nombre, v_item.precio, v_item.cantidad);

    update public.productos
    set inventario = inventario - v_item.cantidad
    where id = v_item.producto_id;

    v_subtotal := v_subtotal + v_item.precio * v_item.cantidad;
  end loop;

  -- Totales con la regla de la sección 5 y los valores de parametros_negocio.
  if v_incluye then
    v_costo_servicio := public.tarifa_servicio(v_tipo_servicio);
  end if;
  v_impuesto := public.calcular_impuesto(v_subtotal);

  update public.pedidos
  set subtotal       = v_subtotal,
      descuento      = 0,
      impuesto       = v_impuesto,
      costo_servicio = v_costo_servicio,
      total          = v_subtotal + v_impuesto + v_costo_servicio
  where id = v_pedido.id
  returning * into v_pedido;

  return v_pedido;
end;
$$;


-- -------------------------------------------------------------------------------------
-- 4. RPC aceptar_cotizacion (RF-22): crea el pedido con las mismas líneas y el mismo total.
-- -------------------------------------------------------------------------------------
create or replace function public.aceptar_cotizacion(id uuid)
returns public.pedidos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id           uuid := id;
  v_cliente_id   uuid := public.mi_cliente_id();
  v_tipo_cliente text;
  v_cotizacion   public.cotizaciones;
  v_linea        record;
  v_pedido       public.pedidos;
begin
  if v_cliente_id is null then
    raise exception 'Acceso no autorizado' using hint = 'ACCESO_NO_AUTORIZADO';
  end if;

  -- Solo el dueño; FOR UPDATE evita que se acepte dos veces al mismo tiempo.
  select * into v_cotizacion
  from public.cotizaciones c
  where c.id = v_id and c.cliente_id = v_cliente_id
  for update;

  if not found then
    raise exception 'Cotización no encontrada' using hint = 'COTIZACION_NO_ENCONTRADA';
  end if;
  if v_cotizacion.estado not in ('nueva', 'vista') then
    raise exception 'Esta cotización ya no admite cambios' using hint = 'ESTADO_NO_PERMITIDO';
  end if;
  if v_cotizacion.vence_en < now() then
    raise exception 'La cotización está vencida' using hint = 'COTIZACION_VENCIDA';
  end if;

  -- Bloquear los productos de la cotización y volver a verificar el inventario (sección 5).
  perform 1
  from public.productos p
  where p.id in (select l.producto_id from public.cotizacion_lineas l where l.cotizacion_id = v_id)
  order by p.id
  for update;

  select cl.tipo into v_tipo_cliente from public.clientes cl where cl.id = v_cliente_id;

  -- Mismo total que la cotización: se copian sus valores tal cual.
  insert into public.pedidos
    (cliente_id, tipo_cliente, origen, cotizacion_id, subtotal, descuento, impuesto,
     incluye_servicio, tipo_servicio, costo_servicio, total)
  values
    (v_cliente_id, v_tipo_cliente, 'cotizacion', v_id, v_cotizacion.subtotal,
     v_cotizacion.descuento, v_cotizacion.impuesto, v_cotizacion.incluye_servicio,
     case when v_cotizacion.incluye_servicio then v_cotizacion.tipo_servicio end,
     v_cotizacion.costo_servicio, v_cotizacion.total)
  returning * into v_pedido;

  for v_linea in
    select l.producto_id, l.codigo_producto, l.nombre_producto, l.precio_unitario, l.cantidad,
           p.inventario, p.activo
    from public.cotizacion_lineas l
    join public.productos p on p.id = l.producto_id
    where l.cotizacion_id = v_id
    order by l.producto_id
  loop
    if not v_linea.activo then
      raise exception 'El producto % ya no está disponible', v_linea.nombre_producto
        using hint = 'PRODUCTO_NO_DISPONIBLE';
    end if;
    if v_linea.cantidad > v_linea.inventario then
      raise exception using
              message = public.mensaje_inventario(v_linea.nombre_producto, v_linea.inventario),
              hint = 'INVENTARIO_INSUFICIENTE',
              detail = json_build_object('producto_id', v_linea.producto_id,
                                         'nombre', v_linea.nombre_producto,
                                         'disponibles', v_linea.inventario)::text;
    end if;

    insert into public.pedido_lineas
      (pedido_id, producto_id, codigo_producto, nombre_producto, precio_unitario, cantidad)
    values
      (v_pedido.id, v_linea.producto_id, v_linea.codigo_producto, v_linea.nombre_producto,
       v_linea.precio_unitario, v_linea.cantidad);

    update public.productos
    set inventario = inventario - v_linea.cantidad
    where productos.id = v_linea.producto_id;  -- "productos.id" para no confundir con el parámetro id
  end loop;

  update public.cotizaciones
  set estado = 'aceptada',
      respondida_en = now()
  where cotizaciones.id = v_id;

  return v_pedido;
end;
$$;


-- -------------------------------------------------------------------------------------
-- 5. RPC rechazar_cotizacion y marcar_cotizacion_vista (RF-21, RF-22).
-- -------------------------------------------------------------------------------------
create or replace function public.rechazar_cotizacion(id uuid)
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

  if not found then
    raise exception 'Cotización no encontrada' using hint = 'COTIZACION_NO_ENCONTRADA';
  end if;
  if v_cotizacion.estado not in ('nueva', 'vista') then
    raise exception 'Esta cotización ya no admite cambios' using hint = 'ESTADO_NO_PERMITIDO';
  end if;
  if v_cotizacion.vence_en < now() then
    raise exception 'La cotización está vencida' using hint = 'COTIZACION_VENCIDA';
  end if;

  update public.cotizaciones
  set estado = 'rechazada',
      respondida_en = now()
  where cotizaciones.id = v_id
  returning * into v_cotizacion;

  return v_cotizacion;
end;
$$;

-- El cliente abre el detalle: nueva → vista. Si ya venció, se guarda como vencida.
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

  if not found then
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
  -- En cualquier otro estado no cambia nada y se devuelve la cotización como está.

  return v_cotizacion;
end;
$$;


-- -------------------------------------------------------------------------------------
-- 6. RPC ventas_y_ganancias (RF-35), solo administrador.
--    Por producto: unidades y ventas a instalador y a cliente final, y
--    ganancia = (precio de venta − costo) × unidades.
--    desde / hasta son fechas (YYYY-MM-DD) en hora de Colombia, ambas incluidas; si se envían
--    vacías se toma todo el historial. Un periodo sin ventas devuelve ceros, no un error.
--    Límite: se usa el costo ACTUAL del producto (el costo no se copia a las líneas del pedido
--    para que el cliente nunca lo reciba) y el descuento del pedido no se reparte por producto.
-- -------------------------------------------------------------------------------------
create or replace function public.ventas_y_ganancias(desde date default null, hasta date default null)
returns table (
  producto_id         uuid,
  codigo              text,
  nombre              text,
  unidades_instalador bigint,
  ventas_instalador   numeric,
  unidades_final      bigint,
  ventas_final        numeric,
  unidades_total      bigint,
  ventas_total        numeric,
  ganancia            numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_desde date := desde;
  v_hasta date := hasta;
begin
  if public.rol_actual() is distinct from 'administrador' then
    raise exception 'Acceso no autorizado' using hint = 'ACCESO_NO_AUTORIZADO';
  end if;
  if v_desde is not null and v_hasta is not null and v_desde > v_hasta then
    raise exception 'La fecha inicial no puede ser mayor que la final' using hint = 'DATOS_INVALIDOS';
  end if;

  return query
  select
    p.id,
    p.codigo,
    p.nombre,
    coalesce(sum(v.cantidad) filter (where v.tipo_cliente = 'instalador'), 0)::bigint,
    coalesce(sum(v.subtotal) filter (where v.tipo_cliente = 'instalador'), 0)::numeric,
    coalesce(sum(v.cantidad) filter (where v.tipo_cliente = 'final'), 0)::bigint,
    coalesce(sum(v.subtotal) filter (where v.tipo_cliente = 'final'), 0)::numeric,
    coalesce(sum(v.cantidad), 0)::bigint,
    coalesce(sum(v.subtotal), 0)::numeric,
    coalesce(sum((v.precio_unitario - p.costo) * v.cantidad), 0)::numeric
  from public.productos p
  left join (
    select l.producto_id as id_producto, l.cantidad, l.subtotal, l.precio_unitario, pe.tipo_cliente
    from public.pedido_lineas l
    join public.pedidos pe on pe.id = l.pedido_id
    where (v_desde is null or (pe.creado_en at time zone 'America/Bogota')::date >= v_desde)
      and (v_hasta is null or (pe.creado_en at time zone 'America/Bogota')::date <= v_hasta)
  ) v on v.id_producto = p.id
  group by p.id, p.codigo, p.nombre
  order by 9 desc, 3;
end;
$$;


-- -------------------------------------------------------------------------------------
-- 7. Permisos de ejecución: solo usuarios con sesión. Cada RPC valida además el rol.
-- -------------------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;

grant execute on function public.calcular_impuesto(numeric)                      to authenticated;
grant execute on function public.tarifa_servicio(text)                           to authenticated;
grant execute on function public.mensaje_inventario(text, integer)               to authenticated;
grant execute on function public.estado_actual(public.cotizaciones)              to authenticated;
grant execute on function public.registrar_pedido_carrito(jsonb, boolean, text)  to authenticated;
grant execute on function public.aceptar_cotizacion(uuid)                        to authenticated;
grant execute on function public.rechazar_cotizacion(uuid)                       to authenticated;
grant execute on function public.marcar_cotizacion_vista(uuid)                   to authenticated;
grant execute on function public.ventas_y_ganancias(date, date)                  to authenticated;
