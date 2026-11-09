-- =====================================================================================
-- 001_esquema.sql — Tablas del servicio remoto (Prompt F2, Hito 1, responsable: Felipe)
--
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo el archivo > Run.
-- Orden obligatorio: 001_esquema.sql, 002_seguridad.sql, 003_funciones.sql y luego
-- supabase/seed/datos_prueba.sql.
--
-- Este archivo solo crea la estructura (tablas, restricciones e índices). La seguridad por rol
-- (RLS) está en 002 y la lógica de negocio (cálculos y funciones RPC) en 003.
-- Nombres en español y en snake_case. Referencias: documentación secciones 3, 4, 5 y 9.
-- =====================================================================================


-- -------------------------------------------------------------------------------------
-- Fecha de modificación automática: cada tabla con "actualizado_en" usa este trigger.
-- -------------------------------------------------------------------------------------
create or replace function public.poner_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;


-- -------------------------------------------------------------------------------------
-- clientes: personas o empresas a las que se vende (RF-33).
-- Un cliente puede tener cuenta en la app (usuario_id) o no tenerla: el trabajador puede
-- registrar clientes sin cuenta.
-- -------------------------------------------------------------------------------------
create table public.clientes (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null check (length(trim(nombre)) > 0),
  telefono       text check (telefono ~ '^[0-9]{7,15}$'),
  correo         text check (correo ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  -- Tipo de comprador: define qué precio ve y paga (decisión del equipo; por defecto final).
  tipo           text not null default 'final' check (tipo in ('instalador', 'final')),
  usuario_id     uuid unique references auth.users (id) on delete set null,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index clientes_nombre_idx on public.clientes (nombre);


-- -------------------------------------------------------------------------------------
-- perfiles: un perfil por cada usuario de Supabase Auth (mismo id). Guarda el rol (RF-01).
-- Lo crea automáticamente el trigger de registro (archivo 002).
-- -------------------------------------------------------------------------------------
create table public.perfiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  nombre         text not null check (length(trim(nombre)) > 0),
  correo         text not null unique,
  telefono       text check (telefono ~ '^[0-9]{7,15}$'),
  rol            text not null default 'cliente'
                 check (rol in ('cliente', 'trabajador', 'administrador')),
  -- Un perfil inactivo no puede operar (RF-34): las políticas de 002 lo bloquean.
  activo         boolean not null default true,
  -- Ficha de cliente del usuario (solo aplica al rol cliente).
  cliente_id     uuid unique references public.clientes (id) on delete set null,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);


-- -------------------------------------------------------------------------------------
-- productos: inventario de Hikvision, EZVIZ y HiLook (RF-05, RF-07, RF-29).
-- -------------------------------------------------------------------------------------
create table public.productos (
  id                   uuid primary key default gen_random_uuid(),
  -- Código opcional (hay productos sin código en el Excel), pero único si existe (RNF-15).
  codigo               text check (codigo is null or length(trim(codigo)) > 0),
  nombre               text not null check (length(trim(nombre)) > 0),
  descripcion          text,
  marca                text not null check (marca in ('Hikvision', 'EZVIZ', 'HiLook')),
  -- Las ocho categorías de RF-07 (la app las traduce a texto visible).
  categoria            text not null check (categoria in (
                         'dvr',                 -- DVR
                         'camaras_turbo_hd',    -- Cámaras Turbo HD bala, turret y domo
                         'camaras_wifi_ip',     -- Cámaras WiFi e IP
                         'kits',                -- Kits
                         'alarmas_sensores',    -- Alarmas y sensores
                         'discos_duros',        -- Discos duros
                         'fuentes_ups',         -- Fuentes y UPS
                         'accesorios_cableado'  -- Accesorios de cableado
                       )),
  -- Valores en pesos colombianos. Nunca negativos (RNF-15).
  costo                numeric(12, 2) not null check (costo >= 0),
  precio_instalador    numeric(12, 2) check (precio_instalador >= 0), -- puede faltar (Excel)
  precio_cliente_final numeric(12, 2) not null check (precio_cliente_final >= 0),
  -- integer impide decimales; el check impide negativos (RNF-15).
  inventario           integer not null default 0 check (inventario >= 0),
  imagen_url           text,
  -- Eliminar un producto = desactivarlo (decisión del equipo, RF-31).
  activo               boolean not null default true,
  -- Productos de prueba: se reemplazan por la carga real del Excel en F7 (RF-32).
  es_prueba            boolean not null default false,
  creado_en            timestamptz not null default now(),
  actualizado_en       timestamptz not null default now()
);

-- Código único sin distinguir mayúsculas ni espacios. Varios productos pueden no tener código.
create unique index productos_codigo_unico on public.productos (upper(trim(codigo)));
create index productos_categoria_idx on public.productos (categoria);
create index productos_marca_idx on public.productos (marca);


-- -------------------------------------------------------------------------------------
-- parametros_negocio: una sola fila con impuestos, tarifas y vigencia.
-- La app y el servidor calculan con estos mismos valores (sección 5).
-- -------------------------------------------------------------------------------------
create table public.parametros_negocio (
  id                   smallint primary key default 1 check (id = 1), -- siempre una sola fila
  impuesto_porcentaje  numeric(5, 2)  not null check (impuesto_porcentaje between 0 and 100),
  tarifa_instalacion   numeric(12, 2) not null check (tarifa_instalacion >= 0),
  tarifa_mantenimiento numeric(12, 2) not null check (tarifa_mantenimiento >= 0),
  vigencia_dias        integer        not null check (vigencia_dias > 0),
  actualizado_en       timestamptz    not null default now()
);

insert into public.parametros_negocio
  (id, impuesto_porcentaje, tarifa_instalacion, tarifa_mantenimiento, vigencia_dias)
values (
  1,
  19,      -- VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-12): IVA 19 % sobre (subtotal − descuento)
  150000,  -- VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-12): tarifa de instalación en COP
  80000,   -- VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-12): tarifa de mantenimiento en COP
  15       -- VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-18): vigencia de la cotización en días
)
on conflict (id) do nothing;


-- -------------------------------------------------------------------------------------
-- ubicaciones: lugares de instalación o mantenimiento de un cliente (RF-26, RNF-13).
-- -------------------------------------------------------------------------------------
create table public.ubicaciones (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clientes (id),
  latitud     double precision not null check (latitud between -90 and 90),
  longitud    double precision not null check (longitud between -180 and 180),
  direccion   text not null check (length(trim(direccion)) > 0),
  referencia  text,
  creada_por  uuid default auth.uid() references auth.users (id) on delete set null,
  creado_en   timestamptz not null default now()
);

create index ubicaciones_cliente_idx on public.ubicaciones (cliente_id);


-- -------------------------------------------------------------------------------------
-- cotizaciones (RF-15 a RF-22). Una solicitud del cliente es una cotización en estado
-- "solicitada"; el trabajador la completa (borrador) y la envía (nueva). Estados (sección 5):
--   solicitada → borrador → nueva → vista → aceptada | rechazada | vencida
-- "Enviada" de RF-19 equivale a nueva o vista.
-- -------------------------------------------------------------------------------------
create sequence public.cotizaciones_numero_seq;

create table public.cotizaciones (
  id                    uuid primary key default gen_random_uuid(),
  -- Número legible para mostrar en la app: COT-00001, COT-00002...
  numero                text not null unique
                        default ('COT-' || lpad(nextval('public.cotizaciones_numero_seq')::text, 5, '0')),
  cliente_id            uuid not null references public.clientes (id),
  tipo_servicio         text not null check (tipo_servicio in ('instalacion', 'mantenimiento')),
  descripcion_necesidad text,
  estado                text not null default 'borrador' check (estado in (
                          'solicitada', 'borrador', 'nueva', 'vista',
                          'aceptada', 'rechazada', 'vencida')),
  -- Valores en COP. Los calcula el servidor (archivo 003), nunca negativos (sección 5).
  descuento             numeric(12, 2) not null default 0 check (descuento >= 0),
  incluye_servicio      boolean not null default true,
  -- Sin valor por defecto a propósito: si llega vacío, el trigger de 003 pone la tarifa.
  costo_servicio        numeric(12, 2) not null check (costo_servicio >= 0),
  subtotal              numeric(14, 2) not null default 0 check (subtotal >= 0),
  impuesto              numeric(14, 2) not null default 0 check (impuesto >= 0),
  total                 numeric(14, 2) not null default 0 check (total >= 0),
  vence_en              timestamptz,  -- se fija al enviar: fecha de envío + vigencia_dias
  enviada_en            timestamptz,
  vista_en              timestamptz,
  respondida_en         timestamptz,  -- fecha en que el cliente aceptó o rechazó
  creada_por            uuid default auth.uid() references auth.users (id) on delete set null,
  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now(),
  -- Una solicitud siempre trae la descripción de la necesidad (RF-15).
  constraint cotizaciones_solicitud_con_descripcion
    check (estado <> 'solicitada' or length(trim(coalesce(descripcion_necesidad, ''))) > 0)
);

create index cotizaciones_cliente_idx on public.cotizaciones (cliente_id);
create index cotizaciones_estado_idx on public.cotizaciones (estado);


-- Líneas de la cotización. Copian código, nombre y precio del producto para conservarlos
-- aunque el producto cambie o se desactive después (RF-31).
create table public.cotizacion_lineas (
  id              uuid primary key default gen_random_uuid(),
  cotizacion_id   uuid not null references public.cotizaciones (id) on delete cascade,
  producto_id     uuid not null references public.productos (id),
  codigo_producto text,
  nombre_producto text not null,                    -- lo llena el trigger de 003
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  cantidad        integer not null check (cantidad >= 1),
  subtotal        numeric(14, 2) generated always as (precio_unitario * cantidad) stored,
  creado_en       timestamptz not null default now(),
  unique (cotizacion_id, producto_id)
);

create index cotizacion_lineas_producto_idx on public.cotizacion_lineas (producto_id);


-- Productos de interés que el cliente indica al solicitar la cotización (RF-15, opcional).
create table public.cotizacion_productos_interes (
  id              uuid primary key default gen_random_uuid(),
  cotizacion_id   uuid not null references public.cotizaciones (id) on delete cascade,
  producto_id     uuid not null references public.productos (id),
  nombre_producto text not null,                    -- lo llena el trigger de 003
  cantidad        integer check (cantidad >= 1),     -- opcional
  creado_en       timestamptz not null default now(),
  unique (cotizacion_id, producto_id)
);


-- -------------------------------------------------------------------------------------
-- pedidos: compra desde el carrito o desde una cotización aceptada (RF-13, RF-14, RF-22).
-- Solo se crean con las funciones RPC de 003 (nunca con un insert directo desde la app).
-- -------------------------------------------------------------------------------------
create sequence public.pedidos_numero_seq;

create table public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  numero           text not null unique
                   default ('PED-' || lpad(nextval('public.pedidos_numero_seq')::text, 5, '0')),
  cliente_id       uuid not null references public.clientes (id),
  -- Tipo del cliente al momento de comprar: separa ventas a instalador y a final (RF-35).
  tipo_cliente     text not null check (tipo_cliente in ('instalador', 'final')),
  origen           text not null check (origen in ('carrito', 'cotizacion')),
  cotizacion_id    uuid unique references public.cotizaciones (id),
  subtotal         numeric(14, 2) not null default 0 check (subtotal >= 0),
  descuento        numeric(12, 2) not null default 0 check (descuento >= 0),
  impuesto         numeric(14, 2) not null default 0 check (impuesto >= 0),
  incluye_servicio boolean not null default false,
  tipo_servicio    text check (tipo_servicio in ('instalacion', 'mantenimiento')),
  costo_servicio   numeric(12, 2) not null default 0 check (costo_servicio >= 0),
  total            numeric(14, 2) not null default 0 check (total >= 0),
  -- Solo "pendiente" en esta versión (límite documentado por el equipo).
  estado           text not null default 'pendiente' check (estado in ('pendiente')),
  creado_por       uuid default auth.uid() references auth.users (id) on delete set null,
  creado_en        timestamptz not null default now(),  -- fecha del pedido
  actualizado_en   timestamptz not null default now(),
  constraint pedidos_origen_coherente
    check ((origen = 'cotizacion') = (cotizacion_id is not null)),
  constraint pedidos_servicio_con_tipo
    check (not incluye_servicio or tipo_servicio is not null)
);

create index pedidos_cliente_idx on public.pedidos (cliente_id);
create index pedidos_creado_en_idx on public.pedidos (creado_en);


-- Líneas del pedido: copia de nombre, código y precio (se conservan aunque el producto cambie).
create table public.pedido_lineas (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references public.pedidos (id) on delete cascade,
  producto_id     uuid not null references public.productos (id),
  codigo_producto text,
  nombre_producto text not null,
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  cantidad        integer not null check (cantidad >= 1),
  subtotal        numeric(14, 2) generated always as (precio_unitario * cantidad) stored,
  creado_en       timestamptz not null default now()
);

create index pedido_lineas_pedido_idx on public.pedido_lineas (pedido_id);
create index pedido_lineas_producto_idx on public.pedido_lineas (producto_id);


-- -------------------------------------------------------------------------------------
-- citas de instalación o mantenimiento (RF-27, RF-28).
-- -------------------------------------------------------------------------------------
create table public.citas (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references public.clientes (id),
  tipo           text not null check (tipo in ('instalacion', 'mantenimiento')),
  fecha          date not null,
  -- Franja en formato "HH:mm-HH:mm". Las franjas válidas están en src/config/valoresPrueba.ts.
  franja         text not null check (franja ~ '^[0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9]$'),
  ubicacion_id   uuid not null references public.ubicaciones (id),  -- obligatoria (sección 5)
  pedido_id      uuid references public.pedidos (id),                -- opcional
  estado         text not null default 'programada'
                 check (estado in ('programada', 'realizada', 'cancelada')),
  creada_por     uuid default auth.uid() references auth.users (id) on delete set null,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index citas_cliente_idx on public.citas (cliente_id);
create index citas_fecha_idx on public.citas (fecha);


-- -------------------------------------------------------------------------------------
-- Triggers de fecha de modificación.
-- -------------------------------------------------------------------------------------
create trigger clientes_actualizado_en before update on public.clientes
  for each row execute function public.poner_actualizado_en();
create trigger perfiles_actualizado_en before update on public.perfiles
  for each row execute function public.poner_actualizado_en();
create trigger productos_actualizado_en before update on public.productos
  for each row execute function public.poner_actualizado_en();
create trigger parametros_actualizado_en before update on public.parametros_negocio
  for each row execute function public.poner_actualizado_en();
create trigger cotizaciones_actualizado_en before update on public.cotizaciones
  for each row execute function public.poner_actualizado_en();
create trigger pedidos_actualizado_en before update on public.pedidos
  for each row execute function public.poner_actualizado_en();
create trigger citas_actualizado_en before update on public.citas
  for each row execute function public.poner_actualizado_en();
