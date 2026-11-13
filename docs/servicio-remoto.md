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
   5. `supabase/migrations/005_solicitud_cotizacion.sql` (RPC `crear_solicitud_cotizacion`: la
      solicitud y sus productos de interés en una sola transacción; prompt F5).
   6. `supabase/migrations/006_borrador_cotizacion.sql` (RPC `guardar_borrador_cotizacion`: la
      cabecera y todas las líneas de un borrador en una sola transacción; prompt F6).
   7. `supabase/migrations/007_borrador_oculto_cliente.sql` (el cliente no ve una cotización
      mientras se prepara: políticas de lectura por estado, vista `cotizaciones_cliente` y
      `marcar_cotizacion_vista` sin devolver borradores; ver la sección 5).
   8. `supabase/migrations/008_compras_y_citas.sql` (compra sin duplicados: identificador de
      compra en `registrar_pedido_carrito`; citas sin repetir día y franja ni en una franja de hoy
      que ya pasó; ver la sección 5). Va en una transacción y se puede ejecutar dos veces.
   9. `supabase/migrations/009_costo_ventas.sql` (costo histórico de las ventas: tabla
      `pedido_lineas_costo`, trigger que guarda el costo de cada línea de pedido y
      `ventas_y_ganancias` con ese costo; prompt F8, ver la sección 5). Va en una transacción y se
      puede ejecutar dos veces.
   10. `supabase/seed/datos_prueba.sql`, **parte 1** (productos de prueba).

   Si el proyecto ya tenía 001 a 007 y los datos de prueba, basta con ejecutar 008. Si ya tenía
   001 a 008, basta con ejecutar 009: debe terminar con el aviso
   `Costo guardado para todas las líneas de pedido (N).`

   Si 008 se detiene con "Hay citas programadas repetidas", no cambió nada. Esta consulta muestra
   cuáles son; el equipo decide cuál cancelar (por ejemplo, desde Citas del trabajador) y vuelve a
   ejecutar 008:

   ```sql
   select c.cliente_id, cl.nombre, c.fecha, c.franja, count(*) as citas
   from public.citas c join public.clientes cl on cl.id = c.cliente_id
   where c.estado = 'programada'
   group by 1, 2, 3, 4 having count(*) > 1;
   ```
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
   de la sección 9 (12 funciones SECURITY DEFINER y Leaked Password Protection).
6. Copia los valores para el `.env` de la app (**Project Settings > API Keys** y **Data API**):
   - `EXPO_PUBLIC_SUPABASE_URL` = Project URL, por ejemplo `https://abcd1234.supabase.co`.
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = la **publishable key** (`sb_publishable_...`). El nombre de
     la variable se conserva por CLAUDE.md, pero su valor es la llave publishable, no la anon legacy.
   - Nunca la llave secreta (`sb_secret_...`) ni la `service_role`.
7. Carga inicial del inventario real (F7, RF-32): ejecuta `supabase/seed/inventario_inicial.sql`
   en el SQL Editor, después de los datos de prueba. Ver la sección 10.
8. En **Authentication > Sign In / Providers > Email**, apaga **"Confirm email"** (decisión del
   equipo en C1): la app no envía correos, así que quien se registra desde la app inicia sesión
   enseguida. Si se deja activa, debe confirmar el correo antes (la app muestra "Debes confirmar tu
   correo…"). Los usuarios que crea el administrador desde la app quedan confirmados.
10. Comprueba la seguridad por HTTP con `npm run verificar-seguridad` (README): con el token del
    cliente no llega costo ni ganancia y modificar productos es rechazado.
9. Usuarios y roles (F8, RF-34): publica la Edge Function `admin-usuarios` y configura su secreto
   siguiendo la sección 11.

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
| Solicitar cotización (RF-15) | RPC `crear_solicitud_cotizacion` (una sola petición; ver la tabla de RPC) |
| Cotizaciones con líneas, personal (RF-19) | `GET /rest/v1/cotizaciones?select=*,estado_actual,cotizacion_lineas(*)&order=creado_en.desc` |
| Bandeja y detalle del cliente (RF-20, RF-21) | `GET /rest/v1/cotizaciones_cliente?select=*&order=creado_en.desc` (líneas y productos de interés vienen como listas en cada fila; ver la sección 5) |
| Guardar borrador (RF-16, RF-17) | RPC `guardar_borrador_cotizacion` (una sola petición; ver la tabla de RPC) |
| Enviar (RF-18) | `PATCH /rest/v1/cotizaciones?id=eq.<id>` con `{"estado": "nueva"}` (solo un borrador ya guardado) |
| Pedidos (RF-14) | `GET /rest/v1/pedidos?select=*,pedido_lineas(*)&order=creado_en.desc` |
| Ubicaciones (RF-26) | `GET`, `POST /rest/v1/ubicaciones` |
| Citas (RF-27, RF-28) | `GET`, `POST /rest/v1/citas`; el personal `PATCH /rest/v1/citas?id=eq.<id>` con `{"estado": ...}` |
| Historial de un cliente para el personal (RF-33) | Los mismos `GET` de ubicaciones, cotizaciones, pedidos y citas con `cliente_id=eq.<id>` |
| Usuarios y roles (RF-34) | `GET /rest/v1/perfiles?select=...&order=nombre` (RLS: el administrador ve todos; los demás, solo el suyo). Crear, editar y activar o desactivar: Edge Function `admin-usuarios` |

Notas para quien programe los servicios:

- **Totales de la cotización:** los calcula el servidor. El trabajador envía `descuento`,
  `incluye_servicio` y, si quiere cambiarlo, `costo_servicio` (null = tarifa de
  `parametros_negocio`); las líneas solo llevan `producto_id` y `cantidad` (el precio, nombre y
  código los copia el servidor según el tipo del cliente).
- **Borrador y envío (F6):** la app primero guarda el borrador con `guardar_borrador_cotizacion`
  y después lo envía con el `PATCH` a `nueva`. Si el envío falla (sin conexión o rechazado por el
  servidor), la cotización sigue en Borrador con lo último que se guardó.
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
| `crear_solicitud_cotizacion` (RF-15) | `{ "tipo_servicio": "instalacion", "descripcion": "...", "productos_interes": [{ "producto_id": "...", "cantidad": 2 }] }` (`productos_interes` y `cantidad` son opcionales) | La cotización creada: solo `id`, `numero` y `estado` (`solicitada`); las demás columnas en null (007) | Cliente |
| `guardar_borrador_cotizacion` (RF-16, RF-17) | `{ "id": null, "cliente_id": "...", "tipo_servicio": "instalacion", "descripcion": null, "descuento": 20000, "incluye_servicio": true, "costo_servicio": null, "lineas": [{ "producto_id": "...", "cantidad": 2 }] }` (`id` null crea uno nuevo; con `id` completa esa solicitud o ese borrador y reemplaza todas sus líneas) | La cotización guardada (estado `borrador`) con los totales del servidor | Trabajador, administrador |
| `registrar_pedido_carrito` (RF-13) | `{ "lineas": [{ "producto_id": "...", "cantidad": 2 }], "incluye_servicio": true, "tipo_servicio": "instalacion", "compra_id": "uuid" }` (`compra_id` desde 008: la app lo crea una vez por compra y lo repite en cada Reintentar; sin él funciona como antes) | El pedido creado. Con un `compra_id` ya usado y el mismo contenido (mismas líneas y cantidades, mismo servicio), el pedido que ya existía, sin descontar inventario otra vez; con otro contenido, `COMPRA_YA_REGISTRADA` | Cliente |
| `aceptar_cotizacion` (RF-22) | `{ "id": "..." }` | El pedido creado | Cliente dueño |
| `rechazar_cotizacion` (RF-22) | `{ "id": "..." }` | La cotización | Cliente dueño |
| `marcar_cotizacion_vista` (RF-21) | `{ "id": "..." }` | La cotización | Cliente dueño |
| `ventas_y_ganancias` (RF-35) | `{ "desde": "2026-10-01", "hasta": "2026-10-31" }` (fechas en hora de Colombia, ambas incluidas; el Panel general envía el primer y el último día del mes) | Una fila por producto, también los no vendidos en cero: unidades y ventas a instalador y a final, totales y `ganancia` = (precio de venta − costo guardado al vender) × unidades (desde 009) | Administrador |

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
| `COMPRA_YA_REGISTRADA` (008) | Tu compra anterior ya quedó registrada como PED-00012. Revísala en Mis pedidos. (`details` trae `{"pedido_id","numero"}`) |
| `CITA_REPETIDA` (008) | Ya tienes una cita programada en ese día y franja. |
| `FRANJA_PASADA` (008) | Esa franja ya pasó. Elige otra franja u otro día (el mismo texto que muestra la app) |
| `CORREO_REGISTRADO` (F8, `admin-usuarios`) | Ya existe un usuario con ese correo |
| `USUARIO_NO_ENCONTRADO` (F8, `admin-usuarios`) | Usuario no encontrado |

Mensajes en "usted": algunos mensajes de 002, 005 y 007 siguen en usted ("Elija el tipo de
servicio", "Describa su necesidad", "Elija una ubicación registrada del cliente" y "No puede cambiar
su propio rol…"). La app los muestra en tú: `src/services/api.ts` los cambia por su texto exacto
(`MENSAJES_EN_TU`, C1). No se hizo una migración 010 para no reescribir funciones SECURITY DEFINER
ya probadas solo por un cambio de texto.

Otros códigos útiles: `23505` (dato duplicado, por ejemplo el código de producto) y `42501`
(la política RLS no permite la operación).

### Edge Functions (`/functions/v1`)

Una sola, `admin-usuarios` (F8, RF-34), para lo que necesita la llave secreta y no puede hacerse
desde la app: crear usuarios de Auth. Se llama con los mismos encabezados de siempre (`apikey` con
la publishable y `Authorization: Bearer <access_token>` del administrador), desde la misma
instancia de Axios. Código: `supabase/functions/admin-usuarios/index.ts`. Cómo publicarla: sección 11.

`POST /functions/v1/admin-usuarios`

| Acción | Cuerpo | Qué hace |
| --- | --- | --- |
| Crear | `{ "accion": "crear", "correo", "contrasena", "nombre", "telefono", "rol" }` | Crea el usuario en Auth ya confirmado (contraseña temporal de 6 caracteres o más). El trigger `al_crear_usuario` le crea perfil cliente y ficha de cliente; si el rol es trabajador o administrador, la función pone el rol y borra esa ficha (como la parte 2 del seed). Si algo falla después de crear el usuario, lo borra para no dejarlo a medias. |
| Editar | `{ "accion": "editar", "id", "nombre", "telefono", "rol" }` | Cambia nombre, teléfono y rol (el correo no se cambia). Si pasa a cliente y no tiene ficha, le crea una (tipo final) o reutiliza la suya. |
| Activar o desactivar | `{ "accion": "cambiar_estado", "id", "activo": true \| false }` | Cambia `perfiles.activo` y bloquea (o desbloquea) el inicio de sesión en Auth. Si Auth falla, el perfil vuelve a como estaba. |

Responde la fila de `perfiles` como quedó (201 al crear, 200 en lo demás). Reglas que revisa:
quien llama debe ser administrador activo (si no, 403 "Acceso no autorizado"; con el token vencido,
401 y la app lo renueva una vez); nadie cambia su propio rol ni se desactiva; teléfono de 7 a 15
dígitos (los espacios se quitan); correo con formato válido y no repetido. Dejar cero
administradores activos lo rechaza el trigger de 002 y la función devuelve su error tal cual
(`ULTIMO_ADMINISTRADOR`). Los errores salen con el formato de PostgREST
(`{ "message", "hint", "code", "details" }`), así el interceptor de `api.ts` los traduce igual que
los de las RPC.

## 5. Seguridad aplicada en el servidor

- **RLS en todas las tablas.** Funciones de apoyo: `rol_actual()` (null si no hay sesión o el perfil
  está inactivo), `es_personal()` (trabajador o administrador activo) y `mi_cliente_id()`.
- **Cliente:** lee y escribe solo lo de su `cliente_id` (cotizaciones, pedidos, citas, ubicaciones).
  Solo crea solicitudes de cotización; acepta, rechaza y marca como vista con las RPC.
- **Cotización en preparación (migración 007).** Borrador es un estado del lado del trabajador
  (sección 5) y la cotización llega a la bandeja del cliente al enviarla (RF-18):
  - En las tablas `cotizaciones` y `cotizacion_lineas` el cliente solo lee sus cotizaciones en
    nueva, vista, aceptada, rechazada o vencida.
  - Su bandeja y su detalle salen de la vista `cotizaciones_cliente` (security_invoker), que toma
    los datos de `cotizaciones_del_cliente()` (SECURITY DEFINER, como `productos_catalogo`). Trae
    todas sus cotizaciones, pero en solicitada o borrador llegan como "solicitada", con subtotal,
    descuento, impuesto, costo del servicio, total e incluye_servicio en null y sin líneas. Los
    productos de interés sí llegan: los escribió el propio cliente y no tienen precios.
  - `marcar_cotizacion_vista` responde "Cotización no encontrada" con una cotización en
    preparación; `aceptar_cotizacion` y `rechazar_cotizacion` ya la rechazaban.
  - `crear_solicitud_cotizacion` le devuelve al cliente solo `id`, `numero` y `estado`; las demás
    columnas llegan en null. Sigue devolviendo una fila de `cotizaciones` porque `create or
    replace` no puede cambiar el tipo que devuelve una función.
  - Por qué así: RLS decide filas, no columnas por fila, y cliente y personal usan el mismo rol
    de base de datos (`authenticated`), así que no se pueden quitar columnas con GRANT solo al
    cliente. Una vista SECURITY DEFINER la marcaría el Security Advisor como error.
  - Para el personal no cambia nada: sigue leyendo la tabla `cotizaciones` completa.
- **Compra sin duplicados (migración 008).** Si la respuesta de `registrar_pedido_carrito` tarda
  más que el tiempo de espera de la app (15 s), el pedido pudo quedar registrado aunque la app no
  lo sepa. Por eso cada compra lleva un `compra_id` (uuid) que la app crea una vez y repite en cada
  Reintentar:
  - El pedido guarda `compra_id` y `compra_huella` (md5 del contenido normalizado: productos
    ordenados, cantidades sumadas si un producto viene dos veces, y el servicio). La restricción
    `pedidos_compra_unica (cliente_id, compra_id)` impide usar un identificador dos veces. Los
    pedidos anteriores a 008 y los de cotizaciones aceptadas quedan con los dos en null.
  - Mismo identificador y misma huella: devuelve el pedido existente, igual que si lo acabara de
    crear, sin descontar inventario. Huella distinta: `COMPRA_YA_REGISTRADA` con el número.
  - Dos llamadas iguales al mismo tiempo: un bloqueo con nombre (`pg_advisory_xact_lock`, por
    cliente e identificador) hace esperar a la segunda hasta que la primera termina; entonces
    encuentra el pedido. Se comprobó con dos sesiones simultáneas: un solo pedido y un solo
    descuento de inventario.
  - Una compra que falla (por ejemplo, sin inventario) no deja nada guardado, así que el mismo
    identificador sirve para el siguiente intento aunque el carrito haya cambiado.
- **Citas (migración 008).** El trigger `citas_20_validar_franja` corre después de
  `citas_10_proteger` (que ya fija el estado programada y rechaza fechas pasadas):
  - `CITA_REPETIDA`: el cliente ya tiene una cita programada ese día en esa franja. Las citas
    canceladas o realizadas no ocupan la franja. Respaldo: índice único parcial
    `citas_programada_unica (cliente_id, fecha, franja) where estado = 'programada'`.
  - `FRANJA_PASADA`: cita para hoy cuya hora de inicio ya llegó, comparando con
    `now() at time zone 'America/Bogota'` (hora de Colombia, no la del servidor, que está en UTC).
    Solo se revisa al crear o si cambian el día o la franja: marcar como Realizada una cita cuya
    franja ya empezó sigue funcionando.
  - No es SECURITY DEFINER: busca con los permisos de quien agenda (el cliente ve sus citas). Nadie
    puede llamarla desde `/rest/v1/rpc`.
- **Costo histórico de las ventas (migración 009, decisión del equipo).** Antes la ganancia usaba
  el costo actual del producto: si el trabajador cambiaba el costo, cambiaban las ganancias de
  meses pasados. Ahora:
  - La tabla `pedido_lineas_costo` guarda el costo unitario de cada línea de pedido en el momento
    de la venta. Va aparte de `pedido_lineas` porque el cliente lee sus líneas de pedido y nunca
    debe recibir el costo (RNF-06).
  - RLS: solo la lee el personal activo. Nadie la escribe desde la app (`authenticated` solo tiene
    SELECT; `anon`, nada).
  - El trigger `pedido_lineas_10_guardar_costo` (función `pedido_lineas_guardar_costo`, SECURITY
    DEFINER, sin EXECUTE para `anon` ni `authenticated`, como las de 004) la llena al insertar cada
    línea, tanto en la compra del carrito como al aceptar una cotización.
  - Las líneas anteriores a 009 se llenaron con el costo que tenía el producto al ejecutar 009 (el
    de antes no se había guardado).
  - `ventas_y_ganancias` calcula `(precio de venta − costo guardado) × unidades`, con la misma firma
    y las mismas columnas que antes.
- **Administración de usuarios (F8).** La lista sale de `perfiles` (RLS: el administrador ve
  todos). Crear, editar y activar o desactivar pasa por la Edge Function `admin-usuarios`, que
  usa la llave secreta (sección 11). Con esa llave las peticiones entran como `service_role`:
  los triggers de protección de la app (`perfiles_proteger`) no aplican, por eso la función repite
  adentro que nadie cambia su propio rol ni se desactiva. El trigger del último administrador sí
  aplica. Desactivar también bloquea el inicio de sesión en Auth (`ban_duration`), así un usuario
  desactivado no puede entrar (RF-34) además de no ver nada (RLS).
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
- El costo de cada venta (009) está en `pedido_lineas_costo`, que el cliente no puede leer: con su
  sesión la tabla devuelve 0 filas aunque vea sus líneas de pedido.
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
-- 9. Comparación: el trabajador sí ve todo. Esperado: 15 productos (79 después de la carga de F7:
--    76 del Excel y 3 de prueba desactivados) y 1 cotización del otro cliente
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

```sql
-- 11. (007) Como cliente, una cotización en preparación llega sin dinero ni líneas.
--     Esperado: las solicitadas o borradores con estado "solicitada", totales en null y
--     cotizacion_lineas = []; las enviadas con sus totales y líneas.
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'cliente@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
select numero, estado, estado_actual, subtotal, total, cotizacion_lineas
from public.cotizaciones_cliente order by creado_en desc;
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
- **Ganancias con el costo al vender, desde 009.** Cada línea de pedido guarda su costo en
  `pedido_lineas_costo`. Los pedidos anteriores a 009 quedaron con el costo que tenía el producto
  al ejecutar 009 (el costo de antes no se había guardado). El descuento del pedido no se reparte
  por producto y el servicio (instalación o mantenimiento) no entra en la ganancia por producto.
- **Usuarios creados por el administrador.** La contraseña temporal la entrega el administrador
  en persona; la app no envía correos ni obliga a cambiarla en el primer inicio de sesión. El
  correo de una cuenta no se cambia desde la app.
- **Pedido solo en estado Pendiente** en esta versión (decisión del equipo).
- **Productos de prueba** (`es_prueba = true`) hasta la carga real del Excel en F7 (RF-32). Después
  de la carga solo quedan, desactivados, los que usa alguna cotización o pedido (sección 10).
- **Carga del Excel con reglas de prueba.** Duplicados, códigos SIN-COD, marcas y categorías están
  por confirmar con el cliente (`docs/depuracion-inventario.md`).
- **Sin protección contra contraseñas filtradas.** Ver "Leaked Password Protection" en la sección 9.

## 9. Advertencias aceptadas del Security Advisor

El primer análisis dio **0 errores y 14 advertencias**. El archivo `004_ajustes_seguridad.sql`
corrige 4 advertencias. Las otras 10 se aceptan a propósito y se explican abajo. Con
`005_solicitud_cotizacion.sql` (F5) se suma una función expuesta a propósito,
`crear_solicitud_cotizacion`, con `006_borrador_cotizacion.sql` (F6) otra,
`guardar_borrador_cotizacion`, y con `007_borrador_oculto_cliente.sql` otra,
`cotizaciones_del_cliente`, así que quedan 13 advertencias aceptadas. La vista
`cotizaciones_cliente` de 007 es security_invoker, así que no suma errores.

`008_compras_y_citas.sql` **no cambia la cuenta** (se espera 0 errores y 13 advertencias):
`registrar_pedido_carrito` se reemplaza por la versión con `compra_id` (se borra la de tres
parámetros, así que sigue siendo una sola función expuesta), y `citas_validar_franja` no es
SECURITY DEFINER, tiene `search_path` fijo y no se puede ejecutar desde la API. Después de
ejecutar 008 hay que revisar el Security Advisor y confirmar esa cuenta.

`009_costo_ventas.sql` (F8) **tampoco cambia la cuenta** (se espera 0 errores y 13 advertencias):

| Objeto de 009 | Qué revisa el Security Advisor | Por qué no suma |
| --- | --- | --- |
| Tabla `pedido_lineas_costo` | "RLS Disabled in Public" (error) y "RLS Enabled No Policy" | Tiene RLS activa y una política de lectura solo para el personal. `anon` no tiene ningún permiso y `authenticated` solo SELECT. |
| Función `pedido_lineas_guardar_costo` | "Function Search Path Mutable" y "SECURITY DEFINER ejecutable por anon/authenticated" | Tiene `search_path = ''` y se le quita EXECUTE a `public`, `anon` y `authenticated` (igual que las de 004); solo corre como trigger. |
| `ventas_y_ganancias` (reemplazada) | La misma advertencia aceptada de siempre | Es la misma función (misma firma); sigue en la lista de aceptadas con el mismo control adentro. |

La Edge Function `admin-usuarios` no aparece en el Security Advisor (revisa la base, no las
funciones). Su protección: verifica el token con Auth, exige administrador activo en `perfiles` y
la llave secreta vive solo en los secretos de Supabase (sección 11). Después de ejecutar 009 hay
que revisar el Security Advisor y confirmar 0 errores y 13 advertencias.

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

### Aceptadas: funciones SECURITY DEFINER que `authenticated` puede ejecutar (12)

Están expuestas a propósito. SECURITY DEFINER les permite leer o escribir lo que el usuario no puede
tocar directamente; por eso cada una valida adentro quién llama y qué devuelve. `anon` no puede
ejecutar ninguna (002 y 003 le quitan EXECUTE).

| Función | Por qué está expuesta | Control adentro |
| --- | --- | --- |
| `crear_solicitud_cotizacion` | El cliente solicita una cotización con sus productos de interés (RF-15) en una sola transacción: si un producto falla, no queda la solicitud a medias. | Exige un cliente activo (`mi_cliente_id()`) y crea siempre a nombre de su propio `cliente_id` (la app no lo envía). Estado `solicitada`, descuento 0 y tarifa del servicio, como el trigger de 002. Valida tipo de servicio, descripción, formato de los productos y cantidades enteras ≥ 1; el trigger de 003 rechaza productos inexistentes o desactivados. Desde 007 responde solo `id`, `numero` y `estado` (el dinero y lo demás en null). Probada en PostgreSQL local (`docs/evidencias/f5-prueba-solicitud.txt` y `docs/evidencias/f-borrador-oculto.txt`). |
| `guardar_borrador_cotizacion` | El personal guarda la cabecera y todas las líneas de un borrador (RF-16, RF-17) en una sola transacción: si una línea falla, el borrador queda como estaba. | Exige personal activo (`es_personal()`). Solo edita cotizaciones en `solicitada` o `borrador` (una enviada no se edita) y las bloquea con `FOR UPDATE`. Valida cliente, tipo de servicio, descuento y costo no negativos, al menos una línea, cantidades enteras ≥ 1 y que el descuento no supere el subtotal. Los triggers de 003 copian precio y nombre, rechazan productos desactivados, sin precio o sin inventario y calculan los totales. Probada en PostgreSQL local (`docs/evidencias/f6-prueba-borrador.txt`). |
| `registrar_pedido_carrito` | El cliente compra desde el carrito (RF-13). No tiene permiso de insertar pedidos ni de cambiar el inventario. | Exige un cliente activo (`mi_cliente_id()`). Valida las cantidades. Toma el precio del producto según el tipo del cliente, nunca de la app. Bloquea los productos con `FOR UPDATE` y verifica el inventario antes de descontarlo. Desde 008, con `compra_id` solo busca pedidos del mismo cliente: devuelve el suyo si es la misma compra o `COMPRA_YA_REGISTRADA` si no. Probada en PostgreSQL local (`docs/evidencias/f-008-compras-citas.txt`). |
| `aceptar_cotizacion` | El cliente convierte la cotización en pedido (RF-22). | Solo el dueño de la cotización. Solo en estado nueva o vista y sin vencer. Bloquea la cotización y los productos y vuelve a verificar el inventario. |
| `rechazar_cotizacion` | El cliente rechaza la cotización (RF-22). No tiene permiso de editar cotizaciones. | Solo el dueño. Solo en estado nueva o vista y sin vencer. |
| `marcar_cotizacion_vista` | El cliente abre el detalle (RF-21). | Solo el dueño. Solo pasa de nueva a vista, o a vencida si ya venció. Desde 007, una cotización en solicitada o borrador responde "Cotización no encontrada" en vez de devolverse con sus totales. |
| `cotizaciones_del_cliente` | Fuente de la vista `cotizaciones_cliente` (007). El cliente ya no puede leer en la tabla las cotizaciones en preparación, pero debe verlas en su bandeja como "Por cotizar". | Solo filas de `mi_cliente_id()` (personal o perfil inactivo: cero filas). En solicitada o borrador devuelve el estado "solicitada", el dinero e incluye_servicio en null y las líneas vacías. Nunca devuelve costo. Probada en PostgreSQL local (`docs/evidencias/f-borrador-oculto.txt`). |
| `ventas_y_ganancias` | El administrador consulta el panel (RF-35). Necesita leer el costo guardado de cada venta (`pedido_lineas_costo`, 009). | Responde solo si `rol_actual()` es administrador activo; si no, "Acceso no autorizado" (también al trabajador). Rechaza fechas al revés. Probada en PostgreSQL local (`docs/evidencias/f8-admin.txt`). |
| `catalogo_productos` | Fuente de la vista `productos_catalogo`. El cliente no puede leer la tabla `productos` (RNF-06). | Nunca devuelve `costo`. Solo productos activos y solo a usuarios con perfil activo. Devuelve únicamente el precio del tipo del cliente. |
| `rol_actual` | La usan las políticas RLS en cada consulta. Si respetara la RLS de `perfiles`, se llamaría a sí misma sin fin. | Solo devuelve el rol de quien llama (`auth.uid()`), y null si el perfil está inactivo. |
| `mi_cliente_id` | La usan las políticas RLS y las RPC. | Solo devuelve el `cliente_id` de quien llama, si es cliente activo. |
| `mi_tipo_cliente` | La usa `catalogo_productos` para elegir el precio. | Solo devuelve el tipo (instalador o final) de quien llama. |

Ninguna entrega datos de otro usuario: las del cliente se filtran por `auth.uid()` y la del
personal exige un trabajador o administrador activo.

### Aceptada: Leaked Password Protection (1)

Supabase puede rechazar contraseñas que aparecen en filtraciones conocidas (HaveIBeenPwned). Esa
opción no está disponible en el plan gratuito. Queda como límite: Supabase Auth exige una longitud
mínima de contraseña (6 caracteres por defecto), pero no revisa si la contraseña aparece en
filtraciones.

## 10. Carga inicial del inventario desde el Excel (F7, RF-32)

El inventario real está en `datos/inventario.xlsx` (una hoja por mes y hojas aparte para HiLook).
Un script lo depura y genera el SQL; la app no lee el Excel.

### Cómo regenerar el SQL

```bash
npm install
npm run depurar-inventario
```

El script (`scripts/depurar-inventario.mjs`, con la librería `exceljs` como dependencia de
desarrollo) lee todas las hojas y escribe dos archivos:

- `docs/depuracion-inventario.md`: informe para revisar con el cliente, con hoja y fila de cada
  caso: productos sin código, códigos repetidos, productos sin precio instalador, inventarios
  finales negativos de todas las hojas, precios menores que el costo, productos de hojas
  anteriores que no se cargan y la tabla de marca y categoría para revisar a mano.
- `supabase/seed/inventario_inicial.sql`: la carga, en una sola transacción.

Se regenera cada vez que cambie el Excel (por ejemplo, una hoja de NOVIEMBRE 26: el script elige
solo la hoja mensual y la hoja HiLook más recientes) o cuando el cliente confirme una regla
distinta. Los dos archivos se generan siempre iguales para el mismo Excel; no se editan a mano.

Reglas aplicadas (VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-32)):

- Se cargan las hojas más recientes: OCTUBRE 26 y HILOOK AGOSTO 26 (76 productos).
- Un código repetido se carga una vez, con la hoja más reciente. Si en esa hoja tiene varias filas
  (lotes con distinto costo), el inventario es la suma de sus inventarios finales y el costo y los
  precios son los de la última fila (decisión del equipo en F7).
- Sin código (o con una palabra genérica como "FUENTES") → SIN-COD-001, SIN-COD-002…
- Inventario negativo → 0. Precio instalador vacío o 0 → nulo.
- Marca y categoría se deducen del nombre, del código y de la hoja.

### Cuándo y cómo ejecutarlo en Supabase

Una sola vez, con 001 a 007 y los datos de prueba ya aplicados: **SQL Editor > New query**, pegar
todo `supabase/seed/inventario_inicial.sql` y **Run**. Debe mostrar el aviso
`Carga correcta: 76 productos del Excel` y una fila con `activos_excel = 76` y
`activos_prueba = 0`. Si algo falla, la transacción se deshace y la base queda como estaba.

Qué pasa con los productos que ya existen:

- Si el código ya existe (por ejemplo el DVR de prueba `DS-7204HGHI-M1(C)`), se actualiza esa misma
  fila con los datos del Excel y queda `es_prueba = false`. Conserva su id, su descripción y su
  imagen, así que las cotizaciones y pedidos que apuntan a ella siguen igual.
- Los productos de prueba que no están en el Excel se **desactivan** si una cotización, un pedido o
  un producto de interés los usa, y se **borran** si nadie los usa.
- Las cotizaciones y pedidos no cambian: sus líneas guardan copia del código, nombre y precio.
- El SQL termina comprobando que no hay códigos repetidos, inventarios negativos ni productos de
  prueba activos. Ejecutarlo otra vez no duplica nada (vuelve a poner los datos del Excel: si
  alguien cambió precios o inventario en la app, se pierden esos cambios).

CP-07 se conserva: el DVR `DS-7204HGHI-M1(C)` tiene inventario final 2 en OCTUBRE 26, así que la
consulta 10 de la sección 7 sigue respondiendo "Solo hay 2 unidades disponibles de …" (ahora con el
nombre del Excel).

Se probó en PostgreSQL 16 local con cotizaciones, pedidos y productos de interés que apuntaban a
productos de prueba: `docs/evidencias/f7-carga-inventario.txt`.

Comprobación rápida después de ejecutarlo (esperado: 0 filas en la primera y 0 en la segunda):

```sql
select upper(trim(codigo)), count(*) from public.productos
where codigo is not null group by 1 having count(*) > 1;
select count(*) from public.productos where inventario < 0;
```


## 11. Usuarios y roles: Edge Function `admin-usuarios` y migración 009 (F8)

Orden: primero 009 en el SQL Editor (sección 2, paso 9), después la llave secreta, el secreto y
la función. La app ya llama a `/functions/v1/admin-usuarios`; mientras la función no esté
publicada, Crear usuario, Guardar cambios y Activar/Desactivar responden con error (la lista de
usuarios sí carga, porque sale de `perfiles`).

### 11.1 La llave secreta (nunca en la app)

1. En el panel: **Project Settings > API Keys**, pestaña de las llaves nuevas (**Publishable and
   secret API keys**), sección **Secret keys**.
2. Pulsa **Add new secret key**, ponle un nombre que diga para qué es (por ejemplo
   `admin_usuarios`) y créala. Así, si algún día se filtra, se borra solo esa sin tocar las demás.
3. Pulsa el ojo para verla y cópiala: empieza por `sb_secret_`.

Esta llave salta todas las políticas RLS. **No va en el `.env`, ni en el código, ni en Git, ni en
la app.** Solo se pega en el secreto del paso siguiente.

### 11.2 El secreto `CSE_LLAVE_SECRETA`

1. **Edge Functions > Secrets** (en el menú izquierdo, dentro de Edge Functions; en paneles
   anteriores: **Project Settings > Edge Functions**).
2. **Add new secret**: Name `CSE_LLAVE_SECRETA` (exacto, en mayúsculas), Value la llave
   `sb_secret_...` y **Save**.

El nombre no puede empezar por `SUPABASE_` (Supabase reserva ese prefijo). `SUPABASE_URL` ya
existe sola en todas las funciones; no hay que crearla.

### 11.3 Publicar la función desde el panel (lo más simple en Windows, sin instalar nada)

1. **Edge Functions > Functions > Deploy a new function > Via Editor**.
2. Nombre de la función: `admin-usuarios` (exacto: es parte de la URL que llama la app).
3. Borra el código de ejemplo del editor, abre `supabase/functions/admin-usuarios/index.ts` en VS
   Code, copia **todo** el archivo y pégalo en el editor del panel.
4. **Deploy function** y espera el aviso de que quedó publicada.
5. En la página de la función, pestaña **Details** (o **Settings**), apaga **Verify JWT with
   legacy secret** ("Enforce JWT Verification" en paneles anteriores) y guarda.
   - Por qué: la función ya verifica el token por su cuenta (se lo pregunta a Auth con
     `/auth/v1/user`) y además exige un administrador activo en `perfiles`. La verificación del
     panel solo sirve con la llave JWT antigua del proyecto; apagarla evita rechazos falsos si el
     proyecto usa las llaves JWT nuevas. Sin un token válido de administrador, la función responde
     401 o 403 igual.
6. Para cambiar el código después: abre la función, pestaña **Code**, pega la versión nueva y
   **Deploy updates**. Cambiar el valor del secreto no exige volver a publicar.

### 11.4 Alternativa: Supabase CLI (sin instalarla en el proyecto)

En una terminal en la carpeta del proyecto (`<ref>` es la parte de la URL antes de
`.supabase.co`):

```bash
npx supabase login
```

```bash
npx supabase link --project-ref <ref>
```

```bash
npx supabase secrets set CSE_LLAVE_SECRETA=sb_secret_...
```

```bash
npx supabase functions deploy admin-usuarios --no-verify-jwt
```

`--no-verify-jwt` es lo mismo que el paso 5 de 11.3. Si el último comando pide Docker, abre Docker
Desktop y repítelo, o usa el panel (11.3). No escribas la llave en archivos ni la subas a Git: el
comando `secrets set` la guarda directo en Supabase.

### 11.5 Comprobar

1. **Edge Functions > admin-usuarios > Logs**: cada llamada aparece con su código (201, 200, 400,
   401, 403). Los `console.error` de la función (por ejemplo "Falta el secreto
   CSE_LLAVE_SECRETA") salen aquí.
2. En la app, con `admin@cse.test`: Drawer > **Usuarios y roles** > **Crear usuario**. Un
   trabajador nuevo debe aparecer en la lista y en **Authentication > Users**, y en la tabla
   `clientes` no debe quedar una ficha con su correo.
3. Consultas en el SQL Editor después de ejecutar 009 (cada bloque por separado):

```sql
-- 12. (009) Toda línea de pedido tiene su costo guardado. Esperado: 0
select count(*) from public.pedido_lineas l
where not exists (select 1 from public.pedido_lineas_costo c where c.pedido_linea_id = l.id);
```

```sql
-- 13. (009) Como cliente, los costos guardados no se ven. Esperado: 0
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'cliente@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
select count(*) from public.pedido_lineas_costo;
```

```sql
-- 14. (009) Ganancia por producto de un mes como administrador. Compárala a mano con
--     (precio_unitario − costo_unitario) × cantidad de la consulta 15.
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'admin@cse.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
select codigo, nombre, unidades_instalador, ventas_instalador, unidades_final, ventas_final, ganancia
from public.ventas_y_ganancias('2026-11-01', '2026-11-30') where unidades_total > 0;
```

```sql
-- 15. (009) Las líneas del mes con su costo guardado (como postgres)
select pe.numero, pe.tipo_cliente, l.nombre_producto, l.precio_unitario, l.cantidad, c.costo_unitario,
       (l.precio_unitario - c.costo_unitario) * l.cantidad as ganancia
from public.pedido_lineas l
join public.pedidos pe on pe.id = l.pedido_id
join public.pedido_lineas_costo c on c.pedido_linea_id = l.id
where (pe.creado_en at time zone 'America/Bogota')::date between '2026-11-01' and '2026-11-30'
order by pe.numero;
```

Se probó en PostgreSQL 16 local (001 a 009, 009 dos veces) y la lógica de la función con un
Supabase simulado: `docs/evidencias/f8-admin.txt`.
