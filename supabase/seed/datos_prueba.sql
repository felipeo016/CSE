-- =====================================================================================
-- datos_prueba.sql — Datos de prueba (Prompt F2, responsable: Felipe)
--
-- Ejecutar después de 001, 002 y 003. Tiene tres partes que se pueden correr por separado:
--   PARTE 1. Productos de prueba (se reemplazan por la carga real del Excel en F7, RF-32).
--   PARTE 2. Roles de los tres usuarios de prueba (primero hay que crearlos en Authentication).
--   PARTE 3. Datos de otro cliente para comprobar que un cliente no ve lo ajeno (RLS).
-- Cada parte se puede ejecutar dos veces sin duplicar datos.
-- El SQL Editor corre como "postgres", por eso aquí no aplican las reglas de la app.
-- =====================================================================================


-- =====================================================================================
-- PARTE 1. Productos de prueba (es_prueba = true)
-- Casos incluidos:
--   * DVR DS-7204HGHI-M1(C) con inventario 2 (caso de prueba CP-07).
--   * Agotado: cámara domo DS-2CE56D0T-IRPF (inventario 0).
--   * Sin imagen: cámara EZVIZ H9C (imagen_url null → la app muestra la imagen alternativa).
--   * Sin código: disco duro 1 TB (codigo null).
--   * Sin precio instalador: cámara IP HiLook IPC-B121H.
-- Los códigos que empiezan por PRUEBA- son inventados para esta prueba.
-- Las imágenes son marcadores de placehold.co, no fotos reales.
-- =====================================================================================
insert into public.productos
  (codigo, nombre, descripcion, marca, categoria, costo, precio_instalador,
   precio_cliente_final, inventario, imagen_url, es_prueba)
select v.codigo, v.nombre, v.descripcion, v.marca, v.categoria, v.costo, v.precio_instalador,
       v.precio_cliente_final, v.inventario, v.imagen_url, true
from (values
  ('DS-7204HGHI-M1(C)', 'DVR 4 canales Turbo HD 1080p Lite',
   'DVR de 4 canales Turbo HD hasta 1080p Lite, compresión H.265+, salida HDMI y VGA, 1 bahía de disco.',
   'Hikvision', 'dvr', 165000::numeric, 195000::numeric, 235000::numeric, 2,
   'https://placehold.co/600x400/png?text=DVR+4CH'),
  ('DS-7208HGHI-M1(C)', 'DVR 8 canales Turbo HD 1080p Lite',
   'DVR de 8 canales Turbo HD hasta 1080p Lite, H.265+, salida HDMI y VGA, 1 bahía de disco.',
   'Hikvision', 'dvr', 230000, 270000, 320000, 4,
   'https://placehold.co/600x400/png?text=DVR+8CH'),
  ('DS-7216HGHI-M1', 'DVR 16 canales Turbo HD 1080p Lite',
   'DVR de 16 canales Turbo HD 1080p Lite, H.265+, salida HDMI y VGA.',
   'Hikvision', 'dvr', 420000, 480000, 560000, 1,
   'https://placehold.co/600x400/png?text=DVR+16CH'),
  ('DS-2CE16D0T-IRPF', 'Cámara bala Turbo HD 1080p',
   'Cámara tipo bala 2 MP, lente fijo, infrarrojo hasta 20 m, carcasa plástica para exterior.',
   'Hikvision', 'camaras_turbo_hd', 48000, 58000, 70000, 25,
   'https://placehold.co/600x400/png?text=Camara+bala'),
  ('DS-2CE76D0T-LPFS', 'Cámara turret Turbo HD 1080p',
   'Cámara turret 2 MP con luz híbrida y audio, ideal para interiores.',
   'Hikvision', 'camaras_turbo_hd', 52000, 62000, 75000, 18,
   'https://placehold.co/600x400/png?text=Camara+turret'),
  ('DS-2CE56D0T-IRPF', 'Cámara domo Turbo HD 1080p',
   'Cámara domo 2 MP, infrarrojo hasta 20 m, para interiores.',
   'Hikvision', 'camaras_turbo_hd', 50000, 60000, 72000, 0,      -- AGOTADO
   'https://placehold.co/600x400/png?text=Camara+domo'),
  ('THC-T120-PC', 'Cámara turret Turbo 1080p HiLook',
   'Cámara turret 2 MP HiLook, infrarrojo 20 m, carcasa plástica.',
   'HiLook', 'camaras_turbo_hd', 40000, 48000, 58000, 20,
   'https://placehold.co/600x400/png?text=HiLook+turret'),
  ('IPC-B121H', 'Cámara IP bala 2 MP HiLook',
   'Cámara IP 2 MP tipo bala, PoE, H.265+, infrarrojo 30 m, IP67.',
   'HiLook', 'camaras_wifi_ip', 95000, null, 145000, 12,         -- SIN PRECIO INSTALADOR
   'https://placehold.co/600x400/png?text=HiLook+IP'),
  ('CS-H6C', 'Cámara WiFi EZVIZ H6C 1080p 360°',
   'Cámara WiFi para interior con giro de 360°, audio bidireccional y detección de movimiento.',
   'EZVIZ', 'camaras_wifi_ip', 120000, 145000, 175000, 10,
   'https://placehold.co/600x400/png?text=EZVIZ+H6C'),
  ('CS-H9C', 'Cámara WiFi EZVIZ H9C 5 MP doble lente',
   'Cámara WiFi para exterior con doble lente, giro horizontal y visión nocturna a color.',
   'EZVIZ', 'camaras_wifi_ip', 260000, 300000, 360000, 5,
   null),                                                         -- SIN IMAGEN
  ('DS-PWA64-KIT-WB', 'Kit de alarma inalámbrica AX PRO',
   'Panel de alarma inalámbrico con sensor de movimiento, contacto magnético y control remoto.',
   'Hikvision', 'kits', 520000, 600000, 720000, 3,
   'https://placehold.co/600x400/png?text=Kit+alarma'),
  ('DS-PDP15P-EG2-WB', 'Sensor de movimiento PIR inalámbrico',
   'Sensor PIR inalámbrico para el kit AX PRO, inmune a mascotas.',
   'Hikvision', 'alarmas_sensores', 70000, 85000, 105000, 8,
   'https://placehold.co/600x400/png?text=Sensor+PIR'),
  (null, 'Disco duro 1 TB púrpura para videovigilancia',             -- SIN CÓDIGO
   'Disco duro de 1 TB diseñado para grabación continua en DVR y NVR.',
   'Hikvision', 'discos_duros', 150000, 175000, 210000, 6,
   'https://placehold.co/600x400/png?text=Disco+1TB'),
  ('PRUEBA-FUE-12V2A', 'Fuente de poder 12 V 2 A',
   'Fuente regulada de 12 V y 2 A para cámaras.',
   'Hikvision', 'fuentes_ups', 12000, 16000, 22000, 30,
   'https://placehold.co/600x400/png?text=Fuente+12V'),
  ('PRUEBA-UTP-C6-305', 'Cable UTP categoría 6 exterior, caja 305 m',
   'Cable UTP categoría 6 para exterior, caja de 305 metros.',
   'Hikvision', 'accesorios_cableado', 380000, 440000, 520000, 4,
   'https://placehold.co/600x400/png?text=Cable+UTP')
) as v (codigo, nombre, descripcion, marca, categoria, costo, precio_instalador,
        precio_cliente_final, inventario, imagen_url)
where not exists (select 1 from public.productos p where p.es_prueba);


-- =====================================================================================
-- PARTE 2. Roles de los usuarios de prueba
--
-- Antes de ejecutar esta parte, crea los tres usuarios en Supabase:
--   1. Authentication > Users > botón "Add user" > "Create new user".
--   2. Escribe el correo y una contraseña, y deja marcada "Auto Confirm User".
--   3. Repite con los tres correos:
--        cliente@cse.test      (quedará como cliente)
--        trabajador@cse.test   (quedará como trabajador)
--        admin@cse.test        (quedará como administrador)
--   El trigger al_crear_usuario les crea a los tres un perfil con rol cliente.
--   Si usas otros correos, cámbialos también aquí abajo.
-- =====================================================================================

-- El trigger le creó una ficha de cliente también al trabajador y al administrador.
-- Se borra (perfiles.cliente_id queda en null solo, por "on delete set null").
delete from public.clientes c
using public.perfiles p
where p.cliente_id = c.id
  and p.correo in ('trabajador@cse.test', 'admin@cse.test')
  and not exists (select 1 from public.cotizaciones q where q.cliente_id = c.id)
  and not exists (select 1 from public.pedidos q where q.cliente_id = c.id)
  and not exists (select 1 from public.ubicaciones q where q.cliente_id = c.id);

update public.perfiles set rol = 'administrador', nombre = 'Administrador de prueba'
where correo = 'admin@cse.test';

update public.perfiles set rol = 'trabajador', nombre = 'Trabajador de prueba'
where correo = 'trabajador@cse.test';

-- El nombre se copia a su ficha de cliente (trigger perfiles_sincronizar_cliente).
update public.perfiles set nombre = 'Cliente de prueba', telefono = '3001112233'
where correo = 'cliente@cse.test';

-- Opcional: para probar precios de instalador, cambia el tipo del cliente de prueba.
-- update public.clientes set tipo = 'instalador' where correo = 'cliente@cse.test';

-- Comprobación: debe mostrar los tres usuarios con su rol.
select correo, nombre, rol, activo, cliente_id
from public.perfiles
where correo in ('cliente@cse.test', 'trabajador@cse.test', 'admin@cse.test')
order by rol;


-- =====================================================================================
-- PARTE 3. Otro cliente (sin cuenta) con una ubicación y una cotización enviada.
-- Sirve para comprobar que cliente@cse.test NO ve estos datos (RNF-05, RNF-13).
-- =====================================================================================
do $$
declare
  v_cliente_id    uuid;
  v_cotizacion_id uuid;
begin
  if exists (select 1 from public.clientes where correo = 'otro.cliente@cse.test') then
    raise notice 'Los datos del otro cliente ya existen; no se crean de nuevo.';
    return;
  end if;

  insert into public.clientes (nombre, telefono, correo, tipo)
  values ('Otro cliente (prueba)', '3009998877', 'otro.cliente@cse.test', 'instalador')
  returning id into v_cliente_id;

  -- Coordenadas de prueba (no son una dirección real de nadie).
  insert into public.ubicaciones (cliente_id, latitud, longitud, direccion, referencia)
  values (v_cliente_id, 4.8133, -75.6961, 'Dirección de prueba 123', 'Ubicación de prueba para RLS');

  insert into public.cotizaciones (cliente_id, tipo_servicio, descripcion_necesidad, estado)
  values (v_cliente_id, 'instalacion', 'Cotización de prueba para otro cliente', 'borrador')
  returning id into v_cotizacion_id;

  -- Nombre, código y precio (de instalador) los copia el trigger desde el producto.
  insert into public.cotizacion_lineas (cotizacion_id, producto_id, cantidad)
  select v_cotizacion_id, p.id, 2 from public.productos p where p.codigo = 'DS-2CE16D0T-IRPF';
  insert into public.cotizacion_lineas (cotizacion_id, producto_id, cantidad)
  select v_cotizacion_id, p.id, 1 from public.productos p where p.codigo = 'DS-7208HGHI-M1(C)';

  -- Enviar: el trigger calcula totales y fija la vigencia.
  update public.cotizaciones set estado = 'nueva' where id = v_cotizacion_id;
end;
$$;

-- Comprobación: la cotización del otro cliente con sus totales calculados.
select numero, estado, subtotal, descuento, impuesto, costo_servicio, total, vence_en
from public.cotizaciones c
join public.clientes cl on cl.id = c.cliente_id
where cl.correo = 'otro.cliente@cse.test';
