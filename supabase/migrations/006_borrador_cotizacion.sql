-- =====================================================================================
-- 006_borrador_cotizacion.sql — Guardar el borrador de una cotización en una sola transacción
-- (Prompt F6, Hito 3, responsable: Felipe)
--
-- Ejecutar después de 005_solicitud_cotizacion.sql.
--
-- Antes, la app guardaba un borrador (RF-16, RF-17) con tres peticiones: la cabecera
-- (POST o PATCH /cotizaciones), las líneas (POST /cotizacion_lineas) y el borrado de las líneas
-- que se quitaron (DELETE /cotizacion_lineas). Si una fallaba a la mitad (por ejemplo, sin
-- conexión), el borrador quedaba con la cabecera nueva y las líneas viejas.
-- La RPC guardar_borrador_cotizacion hace todo dentro de una sola función: PostgreSQL ejecuta
-- cada llamada como una transacción, así que si algo falla no cambia nada.
--
-- Llamada desde la app: POST /rest/v1/rpc/guardar_borrador_cotizacion
--   { "id": null,                       -- null: crea un borrador nuevo; uuid: completa esa
--                                       --       solicitud o ese borrador
--     "cliente_id": "uuid",
--     "tipo_servicio": "instalacion",
--     "descripcion": "Cuatro cámaras para el local",   -- opcional
--     "descuento": 20000,               -- en pesos
--     "incluye_servicio": true,
--     "costo_servicio": 150000,         -- opcional: null = tarifa de parametros_negocio
--     "lineas": [{ "producto_id": "uuid", "cantidad": 2 }] }
-- Devuelve la cotización guardada (estado "borrador") con los totales que calculó el servidor.
--
-- Mismas reglas de 002, 003 y 005:
--   * Solo personal activo (es_personal()), como las políticas cotizaciones_crear/editar de 002.
--   * Solo se edita una cotización en "solicitada" o "borrador": una enviada ya no se edita
--     (trigger cotizaciones_proteger de 002 y decisión del equipo).
--   * Las líneas pasan por el trigger cotizacion_lineas_preparar de 003: copia código, nombre y
--     precio según el tipo del cliente, rechaza productos inexistentes o desactivados, productos
--     sin precio para ese tipo (SIN_PRECIO) y cantidades mayores al inventario.
--   * Los totales los calcula el trigger cotizaciones_calcular de 003 (misma fórmula de la app).
--   * Además (RF-16, RF-17): no se guarda sin cliente ni sin al menos una línea, y el descuento
--     no puede ser negativo ni mayor que el subtotal.
-- =====================================================================================

create or replace function public.guardar_borrador_cotizacion(
  id               uuid,
  cliente_id       uuid,
  tipo_servicio    text,
  descripcion      text,
  descuento        numeric,
  incluye_servicio boolean,
  costo_servicio   numeric,
  lineas           jsonb
)
returns public.cotizaciones
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Copias de los parámetros con prefijo v_ para no confundirlos con columnas.
  v_id            uuid    := id;
  v_cliente_id    uuid    := cliente_id;
  v_tipo_servicio text    := tipo_servicio;
  v_descripcion   text    := nullif(trim(coalesce(descripcion, '')), '');
  v_descuento     numeric := descuento;
  v_incluye       boolean := coalesce(incluye_servicio, false);
  v_costo         numeric := costo_servicio;
  v_lineas        jsonb   := lineas;
  v_elemento      jsonb;
  v_cotizacion    public.cotizaciones;
begin
  -- Solo trabajador o administrador activo (igual que las políticas de 002).
  if not public.es_personal() then
    raise exception 'Acceso no autorizado' using hint = 'ACCESO_NO_AUTORIZADO';
  end if;

  -- ---- Validaciones de los datos recibidos (la app ya las hace; aquí, la última defensa) ----
  if v_cliente_id is null
     or not exists (select 1 from public.clientes c where c.id = v_cliente_id) then
    raise exception 'Elige un cliente' using hint = 'DATOS_INVALIDOS';
  end if;

  if v_tipo_servicio is null or v_tipo_servicio not in ('instalacion', 'mantenimiento') then
    raise exception 'Elige el tipo de servicio' using hint = 'DATOS_INVALIDOS';
  end if;

  if v_descuento is null or v_descuento < 0 then
    raise exception 'El descuento no puede ser negativo' using hint = 'DATOS_INVALIDOS';
  end if;

  if v_costo is not null and v_costo < 0 then
    raise exception 'El costo del servicio no puede ser negativo' using hint = 'DATOS_INVALIDOS';
  end if;

  if v_lineas is null or jsonb_typeof(v_lineas) <> 'array' or jsonb_array_length(v_lineas) = 0 then
    raise exception 'Agrega al menos un producto a la cotización' using hint = 'DATOS_INVALIDOS';
  end if;

  for v_elemento in select e from jsonb_array_elements(v_lineas) e loop
    -- producto_id con formato uuid (así un id mal escrito no da un error raro).
    if jsonb_typeof(v_elemento -> 'producto_id') is distinct from 'string'
       or (v_elemento ->> 'producto_id') !~*
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Producto no encontrado' using hint = 'PRODUCTO_NO_ENCONTRADO';
    end if;
    if jsonb_typeof(v_elemento -> 'cantidad') is distinct from 'number'
       or (v_elemento ->> 'cantidad')::numeric < 1
       or (v_elemento ->> 'cantidad')::numeric <> trunc((v_elemento ->> 'cantidad')::numeric) then
      raise exception 'Cada producto necesita una cantidad entera mayor o igual a 1'
        using hint = 'DATOS_INVALIDOS';
    end if;
  end loop;

  -- Costo del servicio que queda guardado: 0 sin servicio; si se pide y la app no envía valor,
  -- la tarifa de parametros_negocio (misma regla del trigger de 003).
  if not v_incluye then
    v_costo := 0;
  elsif v_costo is null then
    v_costo := public.tarifa_servicio(v_tipo_servicio);
  end if;

  -- ---- 1. Cabecera: crear el borrador o actualizar la solicitud / el borrador existente ----
  -- La función corre como su dueño (SECURITY DEFINER), así que el trigger de protección de 002
  -- no pone estos valores: se escriben aquí explícitamente.
  if v_id is null then
    insert into public.cotizaciones
      (cliente_id, tipo_servicio, descripcion_necesidad, estado, descuento, incluye_servicio,
       costo_servicio, creada_por)
    values
      (v_cliente_id, v_tipo_servicio, v_descripcion, 'borrador', v_descuento, v_incluye,
       v_costo, auth.uid())
    returning * into v_cotizacion;
    v_id := v_cotizacion.id;
  else
    -- FOR UPDATE: si otro trabajador la está enviando o guardando, se espera a que termine.
    select * into v_cotizacion
    from public.cotizaciones c
    where c.id = v_id
    for update;

    if not found then
      raise exception 'Cotización no encontrada' using hint = 'COTIZACION_NO_ENCONTRADA';
    end if;
    if v_cotizacion.estado not in ('solicitada', 'borrador') then
      raise exception 'Una cotización enviada no se puede editar' using hint = 'ESTADO_NO_PERMITIDO';
    end if;

    update public.cotizaciones c
    set cliente_id            = v_cliente_id,
        tipo_servicio         = v_tipo_servicio,
        -- Si la app no envía descripción se conserva la de la solicitud.
        descripcion_necesidad = coalesce(v_descripcion, c.descripcion_necesidad),
        estado                = 'borrador',
        descuento             = v_descuento,
        incluye_servicio      = v_incluye,
        costo_servicio        = v_costo
    where c.id = v_id;

    -- El trigger de 003 cambia el costo por la tarifa cuando se acaba de marcar "incluye
    -- servicio" sin cambiar el valor (por ejemplo, 0). Aquí se deja el valor que pidió el trabajador.
    update public.cotizaciones c
    set costo_servicio = v_costo
    where c.id = v_id
      and c.costo_servicio <> v_costo;
  end if;

  -- ---- 2. Líneas: se reemplazan todas por las recibidas ----
  -- Los triggers de 003 validan cada línea y recalculan los totales de la cotización.
  delete from public.cotizacion_lineas l where l.cotizacion_id = v_id;

  -- Si el mismo producto viene dos veces se guarda una sola línea con la suma de las cantidades.
  insert into public.cotizacion_lineas (cotizacion_id, producto_id, cantidad)
  select v_id,
         (e ->> 'producto_id')::uuid,
         sum((e ->> 'cantidad')::numeric)::integer  -- ::numeric acepta 2 y 2.0
  from jsonb_array_elements(v_lineas) e
  group by (e ->> 'producto_id')::uuid
  order by 2;

  -- ---- 3. Resultado con los totales recalculados por el servidor ----
  select * into v_cotizacion from public.cotizaciones c where c.id = v_id;

  -- El descuento no puede ser mayor que el subtotal (sección 5). Si lo es, se deshace todo.
  if v_cotizacion.descuento > v_cotizacion.subtotal then
    raise exception 'El descuento no puede ser mayor que el subtotal'
      using hint = 'DATOS_INVALIDOS';
  end if;

  return v_cotizacion;
end;
$$;


-- Permisos: solo usuarios con sesión; la función valida adentro que sea personal activo.
revoke execute on function
  public.guardar_borrador_cotizacion(uuid, uuid, text, text, numeric, boolean, numeric, jsonb)
  from public, anon;
grant execute on function
  public.guardar_borrador_cotizacion(uuid, uuid, text, text, numeric, boolean, numeric, jsonb)
  to authenticated;
