-- =====================================================================================
-- 009_costo_ventas.sql — Costo histórico de las ventas (Prompt F8, Hito 4, responsable: Felipe)
--
-- Ejecutar después de 008_compras_y_citas.sql.
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo el archivo > Run.
-- Todo va en una transacción: si algo falla, la base queda como estaba.
-- Se puede ejecutar dos veces sin dañar nada.
--
-- Problema (decisión del equipo): ventas_y_ganancias (003) calculaba la ganancia con el costo
-- ACTUAL del producto. Si el trabajador cambiaba el costo hoy, cambiaban también las ganancias de
-- los meses pasados, y el panel ya no coincidía con lo que se ganó en cada venta (RF-35).
--
-- Solución:
--   1. Tabla pedido_lineas_costo: el costo unitario del producto en el momento de la venta, una
--      fila por línea de pedido. Va en una tabla aparte, y no como columna de pedido_lineas,
--      porque el cliente puede leer sus líneas de pedido y nunca debe recibir el costo (RNF-06).
--      Solo la lee el personal (RLS); nadie la escribe desde la app.
--   2. Trigger al insertar cada línea de pedido (carrito o cotización aceptada): copia el costo.
--   3. Las líneas que ya existen se llenan con el costo actual (es lo mejor que se tiene: el
--      costo de antes no se guardó). Desde aquí en adelante cada venta conserva su costo.
--   4. ventas_y_ganancias usa ese costo: ganancia = (precio de venta − costo al vender) × unidades.
--
-- Security Advisor: no cambia la cuenta (0 errores y 13 advertencias aceptadas). La tabla tiene
-- RLS; la función del trigger es SECURITY DEFINER pero nadie puede ejecutarla desde la API (como
-- las de 004); ventas_y_ganancias ya estaba en la lista de aceptadas.
-- =====================================================================================

begin;


-- -------------------------------------------------------------------------------------
-- 1. Tabla del costo por línea de pedido.
--    on delete cascade: si alguna vez se borra la línea, se borra su costo (nadie borra desde la app).
-- -------------------------------------------------------------------------------------
create table if not exists public.pedido_lineas_costo (
  pedido_linea_id uuid primary key references public.pedido_lineas (id) on delete cascade,
  costo_unitario  numeric(12, 2) not null check (costo_unitario >= 0),
  creado_en       timestamptz not null default now()
);

comment on table public.pedido_lineas_costo is
  'Costo unitario del producto al momento de la venta (F8). Solo lo lee el personal (RNF-06).';

alter table public.pedido_lineas_costo enable row level security;

-- Supabase concede permisos a anon y authenticated en toda tabla nueva: se quitan y se da solo
-- lectura a authenticated. La política deja leer únicamente al personal activo.
revoke all on public.pedido_lineas_costo from public, anon, authenticated;
grant select on public.pedido_lineas_costo to authenticated;

drop policy if exists pedido_lineas_costo_leer on public.pedido_lineas_costo;
create policy pedido_lineas_costo_leer on public.pedido_lineas_costo
  for select to authenticated
  using ((select public.es_personal()));


-- -------------------------------------------------------------------------------------
-- 2. Trigger: al insertar una línea de pedido se guarda el costo del producto en ese momento.
--    Las RPC que crean pedidos (registrar_pedido_carrito y aceptar_cotizacion) ya bloquean el
--    producto con FOR UPDATE antes de insertar la línea, así que el costo leído es el vigente.
--    SECURITY DEFINER: lee productos y escribe en la tabla de costos aunque quien compra (el
--    cliente) no tenga esos permisos. Nadie puede llamarla desde /rest/v1/rpc (ver abajo).
-- -------------------------------------------------------------------------------------
create or replace function public.pedido_lineas_guardar_costo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.pedido_lineas_costo (pedido_linea_id, costo_unitario)
  select new.id, p.costo
  from public.productos p
  where p.id = new.producto_id
  on conflict (pedido_linea_id) do nothing;
  return new;
end;
$$;

-- Igual que 004: la función solo corre como trigger, no desde la API.
revoke execute on function public.pedido_lineas_guardar_costo() from public, anon, authenticated;

drop trigger if exists pedido_lineas_10_guardar_costo on public.pedido_lineas;
create trigger pedido_lineas_10_guardar_costo
  after insert on public.pedido_lineas
  for each row execute function public.pedido_lineas_guardar_costo();


-- -------------------------------------------------------------------------------------
-- 3. Líneas que ya existían: se llenan con el costo actual del producto.
--    on conflict: ejecutar 009 dos veces no cambia los costos ya guardados.
-- -------------------------------------------------------------------------------------
insert into public.pedido_lineas_costo (pedido_linea_id, costo_unitario)
select l.id, p.costo
from public.pedido_lineas l
join public.productos p on p.id = l.producto_id
on conflict (pedido_linea_id) do nothing;


-- -------------------------------------------------------------------------------------
-- 4. RPC ventas_y_ganancias (RF-35), solo administrador. Misma firma y mismas columnas que en
--    003, así la app no cambia de contrato. Lo único distinto es el costo de la ganancia:
--      ganancia = (precio de venta − costo guardado al vender) × unidades
--    Si una línea no tuviera costo guardado (no debería pasar: el trigger y el paso 3 cubren
--    todas), se usa el costo actual del producto para no perderla del total.
--    Límites que siguen: el descuento del pedido no se reparte por producto y el servicio
--    (instalación o mantenimiento) no es un producto, así que no entra en estas cifras.
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
    coalesce(sum((v.precio_unitario - coalesce(v.costo_unitario, p.costo)) * v.cantidad), 0)::numeric
  from public.productos p
  left join (
    select l.producto_id as id_producto, l.cantidad, l.subtotal, l.precio_unitario,
           pe.tipo_cliente, c.costo_unitario
    from public.pedido_lineas l
    join public.pedidos pe on pe.id = l.pedido_id
    left join public.pedido_lineas_costo c on c.pedido_linea_id = l.id
    where (v_desde is null or (pe.creado_en at time zone 'America/Bogota')::date >= v_desde)
      and (v_hasta is null or (pe.creado_en at time zone 'America/Bogota')::date <= v_hasta)
  ) v on v.id_producto = p.id
  group by p.id, p.codigo, p.nombre
  order by 9 desc, 3;
end;
$$;

-- create or replace conserva los permisos, pero se repiten para que el archivo sea completo:
-- anon nunca la ejecuta; authenticated sí, y la función misma exige administrador.
revoke execute on function public.ventas_y_ganancias(date, date) from public, anon;
grant execute on function public.ventas_y_ganancias(date, date) to authenticated;


-- -------------------------------------------------------------------------------------
-- 5. Comprobación: toda línea de pedido tiene su costo. Si no, se deshace todo.
-- -------------------------------------------------------------------------------------
do $$
declare
  v_sin_costo integer;
begin
  select count(*) into v_sin_costo
  from public.pedido_lineas l
  where not exists (select 1 from public.pedido_lineas_costo c where c.pedido_linea_id = l.id);

  if v_sin_costo > 0 then
    raise exception 'Hay % líneas de pedido sin costo guardado', v_sin_costo;
  end if;
  raise notice 'Costo guardado para todas las líneas de pedido (%).',
    (select count(*) from public.pedido_lineas_costo);
end;
$$;

commit;
