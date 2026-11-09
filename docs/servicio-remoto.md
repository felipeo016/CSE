# Servicio remoto: Supabase

Documento del prompt F2 (Hito 1, responsable: Felipe). Completa el "[Servicio por definir]" de las
secciones 9 y RNF-10 de la documentación del proyecto.

## 1. Por qué Supabase

- **Datos compartidos entre dispositivos (RNF-10).** El trabajador envía una cotización desde su
  teléfono y el cliente la ve en el suyo. Supabase es una base de datos PostgreSQL en la nube a la
  que ambos acceden por HTTP.
- **Se consume solo con HTTP y Axios.** Supabase publica la base como API REST (PostgREST), además de
  Auth (inicio de sesión), RPC (funciones de la base) y Edge Functions. No instalamos
  `@supabase/supabase-js`: todas las peticiones salen de la instancia de Axios de
  `src/services/api.ts`, que es lo que se evalúa en el curso.
- **La seguridad la aplica el servidor (RNF-05, RNF-06, RNF-13).** Con Row Level Security (RLS) la
  base decide qué filas ve cada usuario según su rol, aunque alguien haga peticiones por fuera de la
  app. El cliente no recibe el costo porque la base no se lo entrega.
- **Reglas de negocio en un solo lugar.** El descuento de inventario, los totales y el cambio de
  estado de las cotizaciones se hacen en funciones transaccionales de PostgreSQL, así dos compras
  simultáneas de la última unidad no pueden registrarse ambas (RNF-15).
- **Plan gratuito suficiente para el proyecto** y panel web para revisar los datos en la sustentación.

## 2. Cómo montarlo desde cero

1. Entra a <https://supabase.com/dashboard> y crea un proyecto (región más cercana: São Paulo o
   Norte de Virginia). Guarda la contraseña de la base en un lugar seguro; la app no la usa.
2. Abre **SQL Editor > New query** y ejecuta, uno por uno y en este orden, el contenido de:
   1. `supabase/migrations/001_esquema.sql` (tablas, restricciones e índices).
   2. `supabase/migrations/002_seguridad.sql` (RLS, permisos, triggers de protección, registro y
      vista `productos_catalogo`).
   3. `supabase/migrations/003_funciones.sql` (cálculos, triggers de negocio y RPC).
   4. `supabase/migrations/004_ajustes_seguridad.sql` (quita a las funciones de trigger el permiso
      de ejecutarse desde la API; ver la sección 9).
   5. `supabase/seed/datos_prueba.sql`, **parte 1** (productos de prueba).
3. Crea los tres usuarios de prueba en **Authentication > Users > Add user > Create new user**, con
   "Auto Confirm User" marcado:
   - `cliente@cse.test`
   - `trabajador@cse.test`
   - `admin@cse.test`

   Cada uno queda con perfil de cliente gracias al trigger `al_crear_usuario`. Si el panel no acepta
   el dominio `.test`, usa otros correos y cámbialos también en el archivo de datos de prueba.
4. Ejecuta las **partes 2 y 3** de `supabase/seed/datos_prueba.sql`: asignan los roles de trabajador
   y administrador y crean "Otro cliente (prueba)" con una ubicación y una cotización enviada, para
   comprobar que un cliente no ve lo ajeno.
5. Revisa **Advisors > Security Advisor**: 0 errores. Solo deben quedar las advertencias aceptadas
   de la sección 9 (9 funciones SECURITY DEFINER y Leaked Password Protection).
6. Copia los valores para el `.env` de la app (**Project Settings > API Keys** y **Data API**):
   - `EXPO_PUBLIC_SUPABASE_URL` = Project URL, por ejemplo `https://abcd1234.supabase.co`.
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = la **publishable key** (`sb_publishable_...`). El nombre de
     la variable se conserva por CLAUDE.md, pero su valor es la llave publishable, no la anon legacy.
   - Nunca la llave secreta (`sb_secret_...`) ni la `service_role`.
7. Decisión pendiente del equipo: en **Authentication > Sign In / Providers > Email**, la opción
   "Confirm email". Si queda activa, quien se registra desde la app debe confirmar el correo antes
   de iniciar sesión.

## 3. Llaves y encabezados

El proyecto usa la **llave publishable** (`sb_publishable_...`), no la anon legacy:

- **No es un JWT.** Solo identifica el proyecto. Es pública por diseño (va dentro de la app) y la
  seguridad la dan las políticas RLS.
- **Va solo en el encabezado `apikey`**, en todas las peticiones.
- **`Authorization: Bearer <token>` lleva únicamente el `access_token` del usuario con sesión.**
  Nunca se pone la publishable key en `Authorization`.
- Sin `Authorization`, la petición entra como rol `anon`, que en este proyecto no puede leer ninguna
  tabla ni ejecutar ninguna función: solo sirven los endpoints de Auth (registro e inicio de sesión).

| Encabezado | Valor | Cuándo |
| --- | --- | --- |
| `apikey` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` (la publishable) | Siempre |
| `Authorization` | `Bearer <access_token>` | Solo con sesión iniciada |
| `Content-Type` | `application/json` | Peticiones con cuerpo |
| `Prefer` | `return=representation` | POST y PATCH a tablas, para recibir la fila guardada |

## 4. URLs que usará la app

`baseURL` = `EXPO_PUBLIC_SUPABASE_URL`. Las rutas son relativas a esa base.

### Auth (`/auth/v1`)

| Acción | Método y ruta | Cuerpo |
| --- | --- | --- |
| Registro (RF-02) | `POST /auth/v1/signup` | `{ "email", "password", "data": { "nombre", "telefono" } }` |
| Iniciar sesión (RF-01) | `POST /auth/v1/token?grant_type=password` | `{ "email", "password" }` |
| Renovar token (RF-04) | `POST /auth/v1/token?grant_type=refresh_token` | `{ "refresh_token" }` |
| Usuario actual | `GET /auth/v1/user` | — (con `Authorization`) |
| Cerrar sesión | `POST /auth/v1/logout` | — (con `Authorization`) |

El inicio de sesión responde `access_token`, `refresh_token`, `expires_in` (segundos) y `user.id`.
Con `user.id` la app lee el rol: `GET /rest/v1/perfiles?id=eq.<user.id>&select=*`. Si el perfil
tiene `activo = false`, la app cierra la sesión y avisa: el servidor ya le niega todo (RF-34).

`nombre` y `telefono` del registro los usa el trigger para crear el perfil y la ficha de cliente.
El teléfono debe tener solo dígitos (7 a 15); si no, el registro falla en el servidor.

### REST (`/rest/v1`)

| Uso | Método y ruta |
| --- | --- |
| Catálogo del cliente (RF-05) | `GET /rest/v1/productos_catalogo?select=*&order=nombre` |
| Detalle de producto (RF-08) | `GET /rest/v1/productos_catalogo?id=eq.<id>` (lista vacía = "Producto no encontrado") |
| Parámetros de cálculo | `GET /rest/v1/parametros_negocio?id=eq.1` |
| Perfil | `GET` y `PATCH /rest/v1/perfiles?id=eq.<id>` (el usuario solo cambia nombre y teléfono) |
| Productos del personal (RF-29 a RF-31) | `GET`, `POST`, `PATCH /rest/v1/productos` (eliminar = `PATCH {"activo": false}`) |
| Clientes (RF-33) | `GET`, `POST`, `PATCH /rest/v1/clientes` |
| Solicitar cotización (RF-15) | `POST /rest/v1/cotizaciones` y `POST /rest/v1/cotizacion_productos_interes` |
| Cotizaciones con líneas (RF-19, RF-20, RF-21) | `GET /rest/v1/cotizaciones?select=*,estado_actual,cotizacion_lineas(*)&order=creado_en.desc` |
| Elaborar y enviar (RF-16 a RF-18) | `POST`/`PATCH`/`DELETE /rest/v1/cotizacion_lineas` y `PATCH /rest/v1/cotizaciones?id=eq.<id>` con `{"estado": "nueva"}` |
| Pedidos (RF-14) | `GET /rest/v1/pedidos?select=*,pedido_lineas(*)&order=creado_en.desc` |
| Ubicaciones (RF-26) | `GET`, `POST /rest/v1/ubicaciones` |
| Citas (RF-27, RF-28) | `GET`, `POST /rest/v1/citas`; el personal `PATCH /rest/v1/citas?id=eq.<id>` con `{"estado": ...}` |

Notas para quien programe los servicios:

- **Totales de la cotización:** los calcula el servidor. El trabajador envía `descuento`,
  `incluye_servicio` y, si quiere cambiarlo, `costo_servicio`; las líneas solo llevan
  `cotizacion_id`, `producto_id` y `cantidad` (el precio, nombre y código los copia el servidor).
- **`estado_actual`** es una columna calculada: devuelve `vencida` si la cotización está nueva o
  vista y ya pasó `vence_en`. La app debe mostrar ese valor.
- **Fórmula (igual en app y servidor):** base = subtotal − descuento (mínimo 0);
  impuesto = base × IVA / 100 redondeado a pesos; total = base + impuesto + costo del servicio.
- Los números de cotización y pedido (`COT-00001`, `PED-00001`) pueden tener saltos: una operación
  que falla consume el número igual. Es normal en PostgreSQL.

### RPC (`/rest/v1/rpc`)

Todas con `POST` y cuerpo JSON con los nombres exactos de los parámetros.

| Función | Cuerpo | Devuelve | Quién |
| --- | --- | --- | --- |
| `registrar_pedido_carrito` (RF-13) | `{ "lineas": [{ "producto_id": "...", "cantidad": 2 }], "incluye_servicio": true, "tipo_servicio": "instalacion" }` | El pedido creado | Cliente |
| `aceptar_cotizacion` (RF-22) | `{ "id": "..." }` | El pedido creado | Cliente dueño |
| `rechazar_cotizacion` (RF-22) | `{ "id": "..." }` | La cotización | Cliente dueño |
| `marcar_cotizacion_vista` (RF-21) | `{ "id": "..." }` | La cotización | Cliente dueño |
| `ventas_y_ganancias` (RF-35) | `{ "desde": "2026-10-01", "hasta": "2026-10-31" }` | Una fila por producto | Administrador |

Errores: PostgREST responde HTTP 400 con `{ "message", "hint", "details", "code" }`. `message` es
el texto para el usuario y `hint` un código fijo para decidir qué hacer en la app:

| `hint` | Ejemplo de `message` |
| --- | --- |
| `ACCESO_NO_AUTORIZADO` | Acceso no autorizado |
| `COTIZACION_NO_ENCONTRADA` | Cotización no encontrada |
| `COTIZACION_VENCIDA` | La cotización está vencida |
| `ESTADO_NO_PERMITIDO` | Esta cotización ya no admite cambios |
| `PRODUCTO_NO_ENCONTRADO` | Producto no encontrado |
| `PRODUCTO_NO_DISPONIBLE` | El producto X ya no está disponible |
| `SIN_PRECIO` | El producto X no tiene precio registrado para este tipo de cliente |
| `INVENTARIO_INSUFICIENTE` | Solo hay 2 unidades disponibles de X / X: Agotado (`details` trae `{"producto_id","nombre","disponibles"}`) |
| `DATOS_INVALIDOS` | La fecha de la cita no puede ser pasada |
| `ULTIMO_ADMINISTRADOR` | Debe quedar al menos un administrador activo |

Otros códigos útiles: `23505` (dato duplicado, por ejemplo el código de producto) y `42501`
(la política RLS no permite la operación).

### Edge Functions (`/functions/v1`)

No se usan todavía. Quedan para lo que necesite la llave secreta y no pueda hacerse desde la app,
por ejemplo que el administrador cree usuarios de Auth (RF-34, prompt F8):
`POST /functions/v1/<nombre>` con los mismos encabezados.

## 5. Seguridad aplicada en el servidor

- **RLS en todas las tablas.** Funciones de apoyo: `rol_actual()` (null si no hay sesión o el perfil
  está inactivo), `es_personal()` (trabajador o administrador activo) y `mi_cliente_id()`.
- **Cliente:** lee y escribe solo lo de su `cliente_id` (cotizaciones, pedidos, citas, ubicaciones).
  Solo crea solicitudes de cotización; acepta, rechaza y marca como vista con las RPC.
- **Personal:** crea y edita productos y clientes, elabora y envía cotizaciones y cambia el estado
  de las citas (Programada → Realizada o Cancelada).
- **Administrador:** además cambia roles y activa o desactiva perfiles. Nadie cambia su propio rol
  ni se desactiva a sí mismo, y un trigger impide que quede cero administradores activos.
- **Nadie borra filas desde la app.** Pedidos y líneas de pedido solo se crean con las RPC.
- **Sin sesión (`anon`)** no hay acceso a ninguna tabla, vista ni función.

### Cómo se protege el costo (RNF-06)

- El cliente no tiene ninguna política en la tabla `productos`: si la consulta, recibe una lista
  vacía.
- Su catálogo es la vista `productos_catalogo`, que no tiene la columna `costo` y devuelve un solo
  `precio`: el de su tipo (instalador o final), con `tipo_precio` para saber cuál es.
- La vista se crea con `security_invoker = true`: se ejecuta con los permisos de quien la consulta,
  no con los del dueño. Toma los datos de `catalogo_productos()`, una función `SECURITY DEFINER` que
  es la única puerta: devuelve solo columnas sin costo, solo productos activos y solo a usuarios con
  perfil activo. `anon` no puede usar ni la vista ni la función.
- Las líneas de cotización y de pedido copian nombre, código y precio de venta, nunca el costo.
- `ventas_y_ganancias` solo responde al administrador.

**Cómo se verificó.** Antes de entregar, los cuatro archivos se ejecutaron en un PostgreSQL 16 local
(Docker) con una imitación mínima de Supabase (roles `anon` y `authenticated`, tabla `auth.users` y
`auth.uid()`). Se comprobó:

- La vista tiene `{security_invoker=true}`.
- Como cliente, `productos` devuelve 0 filas y `select costo from productos_catalogo` da
  "column costo does not exist".
- Como `anon`, la vista y la función responden "permission denied".
- Un cliente no ve ubicaciones, cotizaciones ni pedidos de otro cliente.
- El flujo completo funcionó: solicitud, borrador, envío, vista, aceptación con pedido del mismo
  total y descuento de inventario, cita.
- Dos compras simultáneas de las 2 últimas unidades: la segunda esperó el bloqueo y recibió "Agotado".

Falta repetir la comprobación en el proyecto real de Supabase con la lista de la sección 7.

## 6. Duración del token

- El `access_token` dura por defecto **1 hora** (`expires_in: 3600`). La app guarda también el
  `refresh_token` y, cuando el token vence, intenta renovarlo **una vez** con
  `grant_type=refresh_token`. Si falla, pide iniciar sesión de nuevo (decisión del equipo).
- Si hace falta que dure más, se cambia en el panel: **Project Settings > JWT Keys** (en paneles
  anteriores, **Authentication > Settings**), campo **Access token expiry time** o "JWT expiry", en
  segundos. El máximo es una semana (604800). Un token más largo es menos seguro, porque un perfil
  desactivado seguiría con un token válido más tiempo. Aun así, el servidor le niega los datos.
  Es mejor dejar 3600 y renovar.

## 7. Comprobación en el SQL Editor: un cliente no ve costos ni datos ajenos

Cada bloque se pega y se ejecuta por separado en el SQL Editor. Las primeras líneas hacen que la
consulta corra "como" el cliente de prueba: `set local` solo dura esa ejecución. También sirve el
selector de rol del SQL Editor (arriba a la derecha: **Role > authenticated** y elegir el usuario).

```sql
-- 0. La vista respeta la seguridad: debe mostrar {security_invoker=true}
select relname, reloptions from pg_class where relname = 'productos_catalogo';
```

```sql
-- 1. Como cliente, la tabla productos está vacía. Esperado: 0
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'cliente@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
select count(*) from public.productos;
```

```sql
-- 2. Como cliente, el catálogo no tiene costo. Esperado: columnas sin "costo"
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'cliente@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
select * from public.productos_catalogo order by nombre;
```

```sql
-- 3. Pedir el costo falla. Esperado: ERROR column "costo" does not exist
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'cliente@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
select costo from public.productos_catalogo;
```

```sql
-- 4. Datos del otro cliente. Esperado: 0 en ubicaciones, cotizaciones, líneas y pedidos,
--    y 1 en clientes y perfiles (solo los propios)
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'cliente@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
select (select count(*) from public.ubicaciones)       as ubicaciones,
       (select count(*) from public.cotizaciones)      as cotizaciones,
       (select count(*) from public.cotizacion_lineas) as lineas,
       (select count(*) from public.pedidos)           as pedidos,
       (select count(*) from public.clientes)          as clientes,
       (select count(*) from public.perfiles)          as perfiles;
```

```sql
-- 5. Modificar productos con sesión de cliente. Esperado: ERROR new row violates row-level security
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'cliente@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
insert into public.productos (nombre, marca, categoria, costo, precio_cliente_final)
values ('Intento', 'EZVIZ', 'kits', 1, 1);
```

```sql
-- 6. Ganancias con sesión de cliente. Esperado: ERROR Acceso no autorizado
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'cliente@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
select * from public.ventas_y_ganancias(null, null);
```

```sql
-- 7. El cliente intenta darse rol de administrador. Esperado: ERROR Acceso no autorizado
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'cliente@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
update public.perfiles set rol = 'administrador' where correo = 'cliente@cse.test';
```

```sql
-- 8. Sin sesión (anon). Esperado: ERROR permission denied for view productos_catalogo
set local role anon;
select * from public.productos_catalogo;
```

```sql
-- 9. Comparación: el trabajador sí ve todo. Esperado: 15 productos y 1 cotización del otro cliente
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'trabajador@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
select (select count(*) from public.productos) as productos,
       (select count(*) from public.cotizaciones) as cotizaciones;
```

```sql
-- 10. CP-07 en el servidor: 3 unidades del DVR que tiene 2. NO cambia nada si falla.
--     Esperado: ERROR Solo hay 2 unidades disponibles de DVR 4 canales Turbo HD 1080p Lite
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'cliente@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
select * from public.registrar_pedido_carrito(
  (select jsonb_build_array(jsonb_build_object('producto_id', id, 'cantidad', 3))
   from public.productos_catalogo where codigo = 'DS-7204HGHI-M1(C)'),
  false, null);
```

Prueba por HTTP (opcional, RNF-06): en el navegador o con Postman, inicia sesión como cliente con
`POST /auth/v1/token?grant_type=password` y pide
`GET /rest/v1/productos_catalogo?select=*` con `apikey` y `Authorization: Bearer <access_token>`.
La respuesta no debe tener `costo`. `GET /rest/v1/productos` debe devolver `[]`.

## 8. Límites

- **Requiere conexión.** Sin internet no se puede leer ni guardar nada nuevo. La app muestra lo que
  tenga en la caché de TanStack Query, avisa y no confirma operaciones (RNF-08).
- **Cuota del plan gratuito.** Base de datos de 500 MB, transferencia y usuarios activos mensuales
  limitados, y el proyecto **se pausa tras una semana sin uso**: hay que reactivarlo en el panel
  antes de una demostración. Las cifras exactas cambian; se revisan en <https://supabase.com/pricing>.
- **Los cambios se ven al recargar, no en tiempo real.** Una cotización enviada aparece en la
  bandeja del cliente al deslizar para recargar o al volver a la pantalla (RF-20). No se usa
  Supabase Realtime.
- **Ganancias con el costo actual.** `ventas_y_ganancias` usa el costo vigente del producto, porque
  el costo no se copia en las líneas que puede leer el cliente. El descuento del pedido tampoco se
  reparte por producto.
- **Pedido solo en estado Pendiente** en esta versión (decisión del equipo).
- **Productos de prueba** (`es_prueba = true`) hasta la carga real del Excel en F7 (RF-32).
- **Sin protección contra contraseñas filtradas.** Ver "Leaked Password Protection" en la sección 9.

## 9. Advertencias aceptadas del Security Advisor

El primer análisis dio **0 errores y 14 advertencias**. El archivo `004_ajustes_seguridad.sql`
corrige 4 advertencias. Las otras 10 se aceptan a propósito y se explican abajo.

### Corregidas con 004: funciones de trigger

`crear_perfil_nuevo_usuario()`, `perfiles_exigir_administrador()`, `perfiles_sincronizar_cliente()`
y `productos_interes_preparar()` son SECURITY DEFINER y solo deben correr como trigger. Supabase
concede EXECUTE a `anon` y `authenticated` en toda función nueva, así que quedaban publicadas en
`/rest/v1/rpc/...`. 004 les quita EXECUTE a `public`, `anon` y `authenticated`.

**Los triggers siguen funcionando.** PostgreSQL revisa el permiso EXECUTE de una función de trigger
una sola vez: cuando se crea el trigger. Esa vez lo creó `postgres`, que es el dueño. Cuando un
trigger se dispara, la función corre sin volver a revisar los permisos de quien hizo el insert o el
update. Por eso el usuario no puede llamarla directamente, pero su insert o update la ejecuta igual.

Se comprobó en el PostgreSQL local, ya con 004 aplicado:

- `anon`, `authenticated` y `supabase_auth_admin` no tienen EXECUTE sobre las cuatro funciones.
  Llamar una directamente responde "permission denied for function".
- Un alta en `auth.users` hecha como `supabase_auth_admin` creó el perfil cliente y su ficha.
- Un cliente que cambió su nombre vio la ficha de cliente actualizada.
- Un cliente agregó un producto de interés y el nombre se copió.
- Dejar cero administradores activos fue rechazado.
- El flujo completo de cotización, pedido y cita siguió pasando.

### Aceptadas: funciones SECURITY DEFINER que `authenticated` puede ejecutar (9)

Están expuestas a propósito. SECURITY DEFINER les permite leer o escribir lo que el usuario no puede
tocar directamente; por eso cada una valida adentro quién llama y qué devuelve. `anon` no puede
ejecutar ninguna (002 y 003 le quitan EXECUTE).

| Función | Por qué está expuesta | Control adentro |
| --- | --- | --- |
| `registrar_pedido_carrito` | El cliente compra desde el carrito (RF-13). No tiene permiso de insertar pedidos ni de cambiar el inventario. | Exige un cliente activo (`mi_cliente_id()`). Valida las cantidades. Toma el precio del producto según el tipo del cliente, nunca de la app. Bloquea los productos con `FOR UPDATE` y verifica el inventario antes de descontarlo. |
| `aceptar_cotizacion` | El cliente convierte la cotización en pedido (RF-22). | Solo el dueño de la cotización. Solo en estado nueva o vista y sin vencer. Bloquea la cotización y los productos y vuelve a verificar el inventario. |
| `rechazar_cotizacion` | El cliente rechaza la cotización (RF-22). No tiene permiso de editar cotizaciones. | Solo el dueño. Solo en estado nueva o vista y sin vencer. |
| `marcar_cotizacion_vista` | El cliente abre el detalle (RF-21). | Solo el dueño. Solo pasa de nueva a vista, o a vencida si ya venció. |
| `ventas_y_ganancias` | El administrador consulta el panel (RF-35). Necesita leer el costo. | Responde solo si `rol_actual()` es administrador; si no, "Acceso no autorizado". |
| `catalogo_productos` | Fuente de la vista `productos_catalogo`. El cliente no puede leer la tabla `productos` (RNF-06). | Nunca devuelve `costo`. Solo productos activos y solo a usuarios con perfil activo. Devuelve únicamente el precio del tipo del cliente. |
| `rol_actual` | La usan las políticas RLS en cada consulta. Si respetara la RLS de `perfiles`, se llamaría a sí misma sin fin. | Solo devuelve el rol de quien llama (`auth.uid()`), y null si el perfil está inactivo. |
| `mi_cliente_id` | La usan las políticas RLS y las RPC. | Solo devuelve el `cliente_id` de quien llama, si es cliente activo. |
| `mi_tipo_cliente` | La usa `catalogo_productos` para elegir el precio. | Solo devuelve el tipo (instalador o final) de quien llama. |

Ninguna de las nueve entrega datos de otro usuario: todas se filtran por `auth.uid()`.

### Aceptada: Leaked Password Protection (1)

Supabase puede rechazar contraseñas que aparecen en filtraciones conocidas (HaveIBeenPwned). Esa
opción no está disponible en el plan gratuito. Queda como límite: Supabase Auth exige una longitud
mínima de contraseña (6 caracteres por defecto), pero no revisa si la contraseña aparece en
filtraciones.
