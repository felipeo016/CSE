-- =====================================================================================
-- 005_solicitud_cotizacion.sql — Solicitud de cotización en una sola transacción
-- (Prompt F5, Hito 3, responsable: Felipe)
--
-- Ejecutar después de 004_ajustes_seguridad.sql.
--
-- Antes, la app guardaba la solicitud (RF-15) con dos peticiones: POST /cotizaciones y luego
-- POST /cotizacion_productos_interes. Si la segunda fallaba (por ejemplo, sin conexión o con un
-- producto desactivado), quedaba una solicitud sin sus productos de interés.
-- La RPC crear_solicitud_cotizacion hace las dos cosas dentro de una sola función: PostgreSQL
-- ejecuta cada llamada como una transacción, así que si algo falla no queda nada guardado.
--
-- Llamada desde la app: POST /rest/v1/rpc/crear_solicitud_cotizacion
--   { "tipo_servicio": "instalacion",
--     "descripcion": "Necesito 4 cámaras para el local",
--     "productos_interes": [{ "producto_id": "uuid", "cantidad": 2 }, { "producto_id": "uuid" }] }
-- Devuelve la cotización creada (estado "solicitada").
--
-- Mismas reglas de 002 y 003:
--   * Solo un cliente con perfil activo (mi_cliente_id()) y siempre a nombre de su propio
--     cliente_id: la app no envía cliente_id.
--   * Estado "solicitada", descuento 0 y costo de servicio con la tarifa (trigger de 003).
--   * Descripción obligatoria (restricción cotizaciones_solicitud_con_descripcion de 001).
--   * Cada producto de interés debe existir y estar activo (trigger productos_interes_preparar
--     de 003, que también copia su nombre). Cantidad opcional, entera y mayor o igual a 1.
-- =====================================================================================

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

  -- 1. La solicitud. La función corre como su dueño (SECURITY DEFINER), así que el trigger de
  --    protección de 002 no pone estos valores: se escriben aquí explícitamente.
  --    costo_servicio va null a propósito: el trigger de cálculo de 003 pone la tarifa.
  insert into public.cotizaciones
    (cliente_id, tipo_servicio, descripcion_necesidad, estado, descuento, costo_servicio,
     creada_por)
  values
    (v_cliente_id, v_tipo_servicio, v_descripcion, 'solicitada', 0, null, auth.uid())
  returning * into v_cotizacion;

  -- 2. Los productos de interés. Si el mismo producto viene dos veces se guarda una sola vez y
  --    se suman las cantidades (null si ninguna trae cantidad). El trigger de 003 copia el nombre
  --    y rechaza los productos inexistentes o desactivados: en ese caso se deshace también el
  --    paso 1 y no queda la solicitud a medias.
  insert into public.cotizacion_productos_interes (cotizacion_id, producto_id, cantidad)
  select v_cotizacion.id,
         (e ->> 'producto_id')::uuid,
         sum((e ->> 'cantidad')::numeric)::integer  -- ::numeric acepta 2 y 2.0
  from jsonb_array_elements(v_productos) e
  group by (e ->> 'producto_id')::uuid;

  return v_cotizacion;
end;
$$;


-- Permisos: solo usuarios con sesión; la función valida adentro que sea un cliente activo.
revoke execute on function public.crear_solicitud_cotizacion(text, text, jsonb) from public, anon;
grant execute on function public.crear_solicitud_cotizacion(text, text, jsonb) to authenticated;
