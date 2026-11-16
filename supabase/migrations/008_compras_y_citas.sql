-- =====================================================================================
-- 008_compras_y_citas.sql — Compra sin duplicados y citas sin repetir ni en franjas pasadas
-- (Migración 008, responsable: Felipe)
--
-- Ejecutar después de 007_borrador_oculto_cliente.sql.
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo el archivo > Run.
-- Todo va en una transacción: si algo falla, la base queda como estaba.
-- Se puede ejecutar dos veces sin dañar nada.
--
-- Problemas que resuelve (los encontró Juan Pablo en J6):
--
-- A. Compra repetida. Si la respuesta de registrar_pedido_carrito tardaba más que el tiempo de
--    espera de la app (15 s), la app mostraba "Sin conexión" aunque el pedido ya se había creado,
--    y Reintentar creaba un segundo pedido y descontaba el inventario otra vez.
--    Solución: cada compra lleva un identificador (uuid) que la app crea una sola vez y repite en
--    cada Reintentar. El servidor guarda ese identificador en el pedido:
--      * Llega un identificador ya usado por ese cliente con el MISMO contenido (mismas líneas y
--        cantidades, mismo servicio): devuelve el pedido que ya existe, sin descontar nada.
--      * Llega con contenido DISTINTO: error COMPRA_YA_REGISTRADA con el número del pedido.
--      * Llega sin identificador: funciona como antes (cada llamada crea un pedido).
--
-- B. Citas. El servidor no impedía:
--      * Dos citas programadas del mismo cliente en el mismo día y franja (CITA_REPETIDA).
--      * Una cita de hoy en una franja que ya empezó, en hora de Colombia (FRANJA_PASADA).
--    Una cita cancelada (o realizada) no ocupa la franja.
--
-- Hints nuevos (README, "Acceso al servicio HTTP"):
--   COMPRA_YA_REGISTRADA  Tu compra anterior ya quedó registrada como PED-00012. Revísala en Mis pedidos.
--   CITA_REPETIDA         Ya tienes una cita programada en ese día y franja.
--   FRANJA_PASADA         Esa franja ya pasó. Elige otra franja u otro día
--                         (el mismo texto que muestra la app, src/utils/citas.ts)
-- =====================================================================================

begin;


-- -------------------------------------------------------------------------------------
-- 1. Pedidos: identificador de compra y huella del contenido.
--    compra_id     uuid que crea la app una vez por compra. Null en los pedidos anteriores a 008,
--                  en los de cotizaciones aceptadas y en las llamadas sin identificador.
--    compra_huella resumen (md5) del contenido normalizado de la compra: productos ordenados con
--                  sus cantidades sumadas y el servicio. Sirve para saber si un Reintentar trae
--                  la misma compra o una distinta.
-- -------------------------------------------------------------------------------------
alter table public.pedidos add column if not exists compra_id uuid;
alter table public.pedidos add column if not exists compra_huella text;

-- Un identificador se usa una sola vez por cliente. Es también el respaldo si dos llamadas
-- iguales llegaran a la vez (la función ya las ordena con un bloqueo, ver la sección 2).
-- Los pedidos con compra_id null no chocan entre sí (en PostgreSQL null nunca es igual a null).
alter table public.pedidos drop constraint if exists pedidos_compra_unica;
alter table public.pedidos add constraint pedidos_compra_unica unique (cliente_id, compra_id);

-- Si hay identificador, hay huella, y al revés.
alter table public.pedidos drop constraint if exists pedidos_compra_con_huella;
alter table public.pedidos add constraint pedidos_compra_con_huella
  check ((compra_id is null) = (compra_huella is null));


-- -------------------------------------------------------------------------------------
-- 2. RPC registrar_pedido_carrito (RF-13, RNF-08, RNF-15), ahora con compra_id.
--    Cambia la firma (un parámetro más), así que se borra la versión de 003 para que no queden
--    dos funciones con el mismo nombre. Luego se vuelven a dar los permisos.
--    Llamada: POST /rest/v1/rpc/registrar_pedido_carrito
--      { "lineas": [{ "producto_id": "uuid", "cantidad": 2 }],
--        "incluye_servicio": true, "tipo_servicio": "instalacion",
--        "compra_id": "uuid" }              -- opcional; sin él funciona como antes
--    Devuelve el pedido (el nuevo o, si es un Reintentar de la misma compra, el que ya existía).
-- -------------------------------------------------------------------------------------
drop function if exists public.registrar_pedido_carrito(jsonb, boolean, text);

create or replace function public.registrar_pedido_carrito(
  lineas           jsonb,
  incluye_servicio boolean default false,
  tipo_servicio    text default null,
  compra_id        uuid default null
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
  v_compra_id      uuid    := compra_id;
  v_cliente_id     uuid    := public.mi_cliente_id();
  v_tipo_cliente   text;
  v_huella         text;
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
      raise exception 'Elige el tipo de servicio' using hint = 'DATOS_INVALIDOS';
    end if;
  else
    v_tipo_servicio := null;
  end if;

  -- ---- Compra repetida (nuevo en 008) ----
  if v_compra_id is not null then
    -- Huella: el contenido normalizado (productos ordenados, cantidades sumadas si un producto
    -- viene dos veces, y el servicio). El orden de las líneas en el carrito no la cambia.
    select md5(coalesce(v_tipo_servicio, 'sin_servicio') || '|' ||
               string_agg(l.producto_id::text || 'x' || l.cantidad, ',' order by l.producto_id))
      into v_huella
    from (
      select (e ->> 'producto_id')::uuid as producto_id,
             sum((e ->> 'cantidad')::numeric)::integer as cantidad
      from jsonb_array_elements(v_lineas) e
      group by 1
    ) l;

    -- Bloqueo con nombre (cliente + identificador) hasta que termine esta transacción. Si llegan
    -- dos llamadas con el mismo identificador al mismo tiempo, la segunda espera aquí a que la
    -- primera termine y después encuentra el pedido que la primera creó.
    perform pg_advisory_xact_lock(
      hashtextextended('compra:' || v_cliente_id::text || ':' || v_compra_id::text, 0));

    select * into v_pedido
    from public.pedidos pe
    where pe.cliente_id = v_cliente_id and pe.compra_id = v_compra_id;

    if found then
      -- Misma compra: es un Reintentar de una compra que ya quedó registrada. Se devuelve el
      -- pedido tal cual, sin crear otro ni descontar inventario.
      if v_pedido.compra_huella = v_huella then
        return v_pedido;
      end if;
      -- Mismo identificador con otro contenido: el carrito cambió después de una compra que sí
      -- se registró. No se crea nada.
      raise exception 'Tu compra anterior ya quedó registrada como %. Revísala en Mis pedidos.',
        v_pedido.numero
        using hint = 'COMPRA_YA_REGISTRADA',
              detail = json_build_object('pedido_id', v_pedido.id,
                                         'numero', v_pedido.numero)::text;
    end if;
  end if;

  -- ---- Desde aquí, igual que en 003 ----
  select c.tipo into v_tipo_cliente from public.clientes c where c.id = v_cliente_id;

  -- Bloquear los productos del carrito (en orden de id para evitar bloqueos cruzados).
  perform 1
  from public.productos p
  where p.id in (select (e ->> 'producto_id')::uuid from jsonb_array_elements(v_lineas) e)
  order by p.id
  for update;

  -- Se crea el pedido y luego se agregan las líneas. Si algo falla más abajo,
  -- la transacción se deshace completa y el pedido no queda registrado.
  insert into public.pedidos
    (cliente_id, tipo_cliente, origen, incluye_servicio, tipo_servicio, compra_id, compra_huella)
  values
    (v_cliente_id, v_tipo_cliente, 'carrito', v_incluye, v_tipo_servicio, v_compra_id, v_huella)
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
      -- ::numeric primero para aceptar 2 y 2.0.
      select (e ->> 'producto_id')::uuid as producto_id,
             sum((e ->> 'cantidad')::numeric)::integer as cantidad
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

-- Permisos: igual que en 003. Nadie sin sesión; la función valida adentro que sea cliente activo.
revoke execute on function public.registrar_pedido_carrito(jsonb, boolean, text, uuid)
  from public, anon;
grant execute on function public.registrar_pedido_carrito(jsonb, boolean, text, uuid)
  to authenticated;


-- -------------------------------------------------------------------------------------
-- 3. Citas: no repetir día y franja, y no agendar una franja de hoy que ya empezó (RF-27).
--    Corre después de citas_10_proteger (002), que ya fija el estado "programada" en las citas
--    que crea la app y rechaza las fechas pasadas. Los triggers corren en orden alfabético.
--    No es SECURITY DEFINER: busca las citas con los permisos de quien agenda (el cliente ve
--    las suyas y el personal todas), que es justo lo que necesita comparar.
-- -------------------------------------------------------------------------------------
create or replace function public.citas_validar_franja()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  -- Fecha y hora actuales en Colombia, sin importar la zona horaria del servidor (UTC).
  v_ahora_colombia timestamp := now() at time zone 'America/Bogota';
  -- Hora de inicio de la franja: "08:00-10:00" → "08:00".
  v_inicio         text      := split_part(new.franja, '-', 1);
begin
  -- Solo una cita programada ocupa la franja. Cancelar o marcar como realizada no se revisa.
  if new.estado <> 'programada' then
    return new;
  end if;

  -- Al crear, o si cambian el día o la franja (desde la app eso no se puede; 002 lo impide).
  if tg_op = 'INSERT' or (new.fecha, new.franja) is distinct from (old.fecha, old.franja) then
    -- FRANJA_PASADA: hoy, con la hora de inicio ya cumplida. Las horas "HH:mm" se comparan como
    -- texto, igual que en la app (src/utils/citas.ts): "08:00" <= "09:15".
    if new.fecha = v_ahora_colombia::date
       and v_inicio <= to_char(v_ahora_colombia, 'HH24:MI') then
      raise exception 'Esa franja ya pasó. Elige otra franja u otro día'
        using hint = 'FRANJA_PASADA';
    end if;
  end if;

  if tg_op = 'INSERT'
     or (new.cliente_id, new.fecha, new.franja, new.estado)
        is distinct from (old.cliente_id, old.fecha, old.franja, old.estado) then
    -- Bloqueo con nombre (cliente + día + franja): si llegan dos citas iguales al mismo tiempo,
    -- la segunda espera a que la primera termine y entonces ya la ve.
    perform pg_advisory_xact_lock(
      hashtextextended('cita:' || new.cliente_id::text || ':' || new.fecha::text || ':' || new.franja, 0));

    if exists (
      select 1 from public.citas c
      where c.cliente_id = new.cliente_id
        and c.fecha = new.fecha
        and c.franja = new.franja
        and c.estado = 'programada'
        and c.id <> new.id
    ) then
      raise exception 'Ya tienes una cita programada en ese día y franja.'
        using hint = 'CITA_REPETIDA';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists citas_20_validar_franja on public.citas;
create trigger citas_20_validar_franja
  before insert or update on public.citas
  for each row execute function public.citas_validar_franja();

-- Solo corre como trigger (igual que en 004): nadie la llama desde /rest/v1/rpc.
revoke execute on function public.citas_validar_franja() from public, anon, authenticated;


-- Respaldo en la base: un índice único que solo cuenta las citas programadas.
-- Antes de crearlo se revisa que no existan repetidas; si existen, se detiene todo sin cambiar
-- nada para que el equipo decida cuál conservar (no se cancela ninguna automáticamente).
do $$
begin
  if exists (
    select 1 from public.citas
    where estado = 'programada'
    group by cliente_id, fecha, franja
    having count(*) > 1
  ) then
    raise exception 'Hay citas programadas repetidas (mismo cliente, día y franja). Revísalas antes de aplicar 008.'
      using hint = 'Consulta el README, "Montaje de Supabase", paso 2.';
  end if;
end;
$$;

create unique index if not exists citas_programada_unica
  on public.citas (cliente_id, fecha, franja)
  where estado = 'programada';


-- Que la API (PostgREST) vea enseguida la firma nueva de registrar_pedido_carrito.
notify pgrst, 'reload schema';

commit;
