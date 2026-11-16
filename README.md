# Centro de Seguridad Electrónica — App móvil

Proyecto final de Desarrollo Móvil II. Equipo: Felipe Obregón Castro y Juan Pablo Murillo
Villalobos.

## Qué es la app

Una app para un negocio que vende, instala y da mantenimiento a cámaras de seguridad (Hikvision,
EZVIZ y HiLook). Reemplaza el Excel del inventario por un servicio compartido entre teléfonos y
tiene tres roles:

- **Cliente:** consulta el catálogo, compra con el carrito, solicita cotizaciones, las recibe en
  su bandeja, las acepta o rechaza, registra el lugar del servicio en el mapa y agenda la cita.
- **Trabajador:** arma y envía cotizaciones con el inventario real, administra productos y
  clientes, registra ubicaciones y cambia el estado de las citas.
- **Administrador:** todo lo del trabajador, más el Panel general (ventas y ganancias) y Usuarios
  y roles.

**Proceso principal:** el cliente solicita una cotización → el trabajador la elabora y la envía →
el cliente la acepta y se crea el pedido → el cliente registra su ubicación y agenda la cita → el
trabajador la marca como Realizada.

Tecnologías: React Native + TypeScript (strict) + Expo SDK 58 con Expo Router, NativeWind,
Zustand, TanStack Query, Axios y Supabase (consumido solo por HTTP), OpenStreetMap + Leaflet 1.9.4
dentro de una WebView y expo-location.

## Requisitos

- [Node.js](https://nodejs.org/): **22.13 o superior de la 22, 24.3 o superior de la 24, o 26 en
  adelante**. Son las versiones que acepta Expo SDK 58 (`engines` de `expo`); con otra versión
  `npm install` o `npx expo start` fallan. El CI usa Node 26. Revisa la tuya con `node -v`.
- Git.
- Un teléfono real (Android o iPhone) con **Expo Go** compatible con **Expo SDK 58** (Play Store o
  App Store).
- El computador y el teléfono en la misma red Wi‑Fi (o usar `--tunnel`, ver abajo).
- Una cuenta gratuita de [Supabase](https://supabase.com) para el servicio remoto.

## Instalación desde cero

```bash
git clone https://github.com/felipeo016/CSE.git
```

```bash
cd CSE
```

```bash
npm install
```

Después monta Supabase (siguiente sección) y crea el `.env`.

## Montaje de Supabase (en orden)

Todo se hace en el panel de Supabase, sin instalar nada. Sigue este orden:

1. **Proyecto.** Crea uno en <https://supabase.com/dashboard> (región São Paulo o Norte de
   Virginia). Guarda la contraseña de la base en un lugar seguro; la app no la usa.
2. **Migraciones.** En **SQL Editor > New query** pega y ejecuta, uno por uno y en este orden, los
   archivos de `supabase/migrations/`:

   | Archivo | Qué hace |
   | --- | --- |
   | `001_esquema.sql` | Tablas, restricciones e índices (incluido el código de producto único). |
   | `002_seguridad.sql` | RLS en todas las tablas, roles, triggers de protección, perfil al registrarse y vista `productos_catalogo` sin costo. |
   | `003_funciones.sql` | Cálculo de totales y funciones RPC (pedido, aceptar, rechazar, marcar vista, ventas). |
   | `004_ajustes_seguridad.sql` | Quita a las funciones de trigger el permiso de ejecutarse desde la API. |
   | `005_solicitud_cotizacion.sql` | RPC `crear_solicitud_cotizacion` (solicitud y productos de interés en una transacción). |
   | `006_borrador_cotizacion.sql` | RPC `guardar_borrador_cotizacion` (cabecera y líneas en una transacción). |
   | `007_borrador_oculto_cliente.sql` | El cliente no ve una cotización mientras se prepara (vista `cotizaciones_cliente`). |
   | `008_compras_y_citas.sql` | Compra sin duplicados (`compra_id`) y citas sin repetir ni en franjas pasadas. Se puede ejecutar dos veces. |
   | `009_costo_ventas.sql` | Guarda el costo de cada venta para calcular la ganancia. Se puede ejecutar dos veces. |

   No hay migración 010: los mensajes del servidor que estaban en "usted" se pasan a "tú" en la
   app (`src/services/api.ts`). Si 008 se detiene con "Hay citas programadas repetidas", no cambió
   nada: cancela una de las citas repetidas y vuelve a ejecutarla.
3. **Datos de prueba, parte 1.** Ejecuta la parte 1 de `supabase/seed/datos_prueba.sql`
   (productos de prueba).
4. **Usuarios de prueba.** En **Authentication > Users > Add user > Create new user**, con **Auto
   Confirm User** marcado, crea `cliente@cse.test`, `trabajador@cse.test` y `admin@cse.test`. Elige
   tú las contraseñas y guárdalas fuera del repositorio. Los tres quedan como clientes (lo hace un
   trigger); el paso siguiente les da su rol. Si el panel no acepta el dominio `.test`, usa otros
   correos y cámbialos también en `supabase/seed/datos_prueba.sql`.
5. **Datos de prueba, partes 2 y 3.** Ejecútalas: asignan los roles de trabajador y administrador y
   crean "Otro cliente (prueba)" para comprobar que un cliente no ve lo ajeno.
6. **Inventario real.** Pega todo `supabase/seed/inventario_inicial.sql` en el SQL Editor y
   ejecútalo **una sola vez**. Debe terminar con el aviso `Carga correcta: 76 productos del Excel`
   y una fila con `activos_excel = 76` y `activos_prueba = 0`. Va en una transacción: si algo
   falla, la base queda como estaba. Los productos de prueba con el mismo código se actualizan con
   los datos del Excel (conservan su id); los que no están en el Excel se desactivan si una
   cotización o un pedido los usa y se borran si no. Ejecutarlo otra vez no duplica nada, pero
   vuelve a poner los precios e inventarios del Excel y se pierden los cambios hechos en la app.
7. **Edge Function `admin-usuarios`** (Usuarios y roles; crear usuarios exige una llave que no
   puede ir en la app):
   1. **Project Settings > API Keys > Secret keys > Add new secret key** (por ejemplo
      `admin_usuarios`) y copia la llave que empieza por `sb_secret_`.
   2. **Edge Functions > Secrets > Add new secret**: nombre `CSE_LLAVE_SECRETA` (exacto), valor
      esa llave. `SUPABASE_URL` ya existe; no hay que crearla.
   3. **Edge Functions > Functions > Deploy a new function > Via Editor**, nombre `admin-usuarios`
      (exacto), borra el ejemplo, pega todo `supabase/functions/admin-usuarios/index.ts` y pulsa
      **Deploy function**.
   4. En la función, apaga **Verify JWT with legacy secret** y guarda: la función ya comprueba el
      token y que quien llama sea administrador activo.

   La llave secreta salta todas las políticas: **solo** va en ese secreto, nunca en el `.env`, en
   el código ni en Git. Si la función falla, revisa **Edge Functions > admin-usuarios > Logs**.
8. **Confirm email apagado.** En **Authentication > Sign In / Providers > Email**, apaga **Confirm
   email**: la app no envía correos, así que quien se registra inicia sesión enseguida. Los
   usuarios que crea el administrador desde la app ya quedan confirmados.
9. **Revisión.** **Advisors > Security Advisor** debe dar 0 errores y 13 advertencias aceptadas:
   12 funciones SECURITY DEFINER que un usuario con sesión puede ejecutar (cada una revisa el rol
   por dentro) y Leaked Password Protection (no está en el plan gratuito). Después corre
   `npm run verificar-seguridad` (más abajo).

Comprobación rápida del inventario en el SQL Editor (las dos deben dar 0):

```sql
select upper(trim(codigo)), count(*) from public.productos
where codigo is not null group by 1 having count(*) > 1;
select count(*) from public.productos where inventario < 0;
```

El plan gratuito **pausa el proyecto tras una semana sin uso**: antes de una demostración entra al
panel y, si está pausado, pulsa **Restore project** (tarda unos minutos).

## Configuración del `.env`

Copia la plantilla (en PowerShell):

```powershell
Copy-Item .env.template .env
```

En Git Bash, macOS o Linux:

```bash
cp .env.template .env
```

Completa los dos valores (en Supabase, **Project Settings > API Keys** y **Data API**):

| Variable | Valor |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Project URL, por ejemplo `https://abcd1234.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | La **publishable key** (`sb_publishable_...`) |

Las variables `EXPO_PUBLIC_` quedan dentro de la app, así que **no son secretas**: la publishable
key es pública por diseño y la seguridad la dan las políticas RLS de la base. El `.env` no se sube
al repositorio. Después de cambiarlo, reinicia con `npx expo start --clear`.

### Acceso al servicio HTTP

Toda petición sale de una sola instancia de Axios (`src/services/api.ts`) con
`baseURL = EXPO_PUBLIC_SUPABASE_URL`. Encabezados:

| Encabezado | Valor | Cuándo |
| --- | --- | --- |
| `apikey` | La publishable key | Siempre |
| `Authorization` | `Bearer <access_token del usuario>` (nunca la publishable key) | Con sesión |
| `Prefer` | `return=representation` | POST y PATCH a tablas, para recibir la fila guardada |

Sin sesión la petición entra como `anon`, que no puede leer ninguna tabla: solo sirven el registro
y el inicio de sesión.

**Auth (`/auth/v1`)**

| Acción | Método y ruta |
| --- | --- |
| Registro | `POST /auth/v1/signup` con `{ email, password, data: { nombre, telefono } }` (teléfono de 7 a 15 dígitos) |
| Iniciar sesión | `POST /auth/v1/token?grant_type=password` |
| Renovar el token | `POST /auth/v1/token?grant_type=refresh_token` |
| Cerrar sesión | `POST /auth/v1/logout` |

**REST (`/rest/v1`)**

| Uso | Método y ruta |
| --- | --- |
| Catálogo y detalle del cliente | `GET /rest/v1/productos_catalogo` (vista sin costo; `?id=eq.<id>` vacía = "Producto no encontrado") |
| Parámetros de cálculo (IVA y tarifas) | `GET /rest/v1/parametros_negocio?id=eq.1` |
| Perfil y usuarios | `GET` y `PATCH /rest/v1/perfiles` |
| Productos del personal | `GET`, `POST`, `PATCH /rest/v1/productos` (eliminar = `PATCH {"activo": false}`) |
| Clientes | `GET`, `POST`, `PATCH /rest/v1/clientes` |
| Cotizaciones del personal | `GET /rest/v1/cotizaciones` (con `estado_actual` y líneas); enviar = `PATCH` con `{"estado": "nueva"}` |
| Bandeja y detalle del cliente | `GET /rest/v1/cotizaciones_cliente` |
| Pedidos | `GET /rest/v1/pedidos` (con sus líneas) |
| Ubicaciones | `GET`, `POST /rest/v1/ubicaciones` |
| Citas | `GET`, `POST /rest/v1/citas`; el personal cambia el estado con `PATCH` |

**RPC (`POST /rest/v1/rpc/<función>`)**: `crear_solicitud_cotizacion` (cliente),
`guardar_borrador_cotizacion` (personal), `registrar_pedido_carrito` (cliente, con `compra_id`),
`aceptar_cotizacion`, `rechazar_cotizacion` y `marcar_cotizacion_vista` (cliente dueño) y
`ventas_y_ganancias` (administrador).

**Edge Function**: `POST /functions/v1/admin-usuarios` con `accion` = `crear`, `editar` o
`cambiar_estado` (solo administrador activo).

Errores: PostgREST responde `{ message, hint, details, code }`. `message` es el texto para el
usuario y `hint` un código fijo (`INVENTARIO_INSUFICIENTE`, `COTIZACION_VENCIDA`,
`COMPRA_YA_REGISTRADA`, `CITA_REPETIDA`, `FRANJA_PASADA`, `ACCESO_NO_AUTORIZADO`…) que el
interceptor de `api.ts` convierte en el error que muestra cada pantalla.

## Comandos

| Comando | Para qué sirve |
| --- | --- |
| `npx expo start` (o `npm start`) | Arranca la app; se abre en Expo Go escaneando el QR. |
| `npx expo start --tunnel` | Igual, pero sin estar en la misma Wi‑Fi (redes que bloquean la conexión). |
| `npx expo start --clear` | Arranca limpiando la caché (después de cambiar `.env` o `tailwind.config.js`). |
| `npm run typecheck` | Revisa los tipos de TypeScript sin generar archivos. Debe terminar sin errores. |
| `npx expo-doctor` | Revisa que las dependencias sean compatibles con Expo SDK 58. |
| `npm run depurar-inventario` | Lee el Excel del inventario y regenera `supabase/seed/inventario_inicial.sql` y un informe de los casos a revisar. No se conecta a Supabase. El Excel no viene en el repositorio: para usarlo, colócalo en `datos/inventario.xlsx` (si falta, el comando avisa y termina sin cambiar nada); el informe se escribe en `docs/depuracion-inventario.md` y la carpeta se crea sola. |
| `npm run verificar-seguridad` | Inicia sesión como cliente de prueba y comprueba contra Supabase que no recibe costo ni ganancia y que no puede modificar productos (ver abajo). |

### `npm run verificar-seguridad`

Comprueba CP-11 y RNF-05/RNF-06 por HTTP, como lo haría alguien por fuera de la app: con el token
del cliente, el catálogo, las cotizaciones y los pedidos no traen `costo` ni `ganancia`, la tabla
`productos` y los costos de las ventas llegan vacíos, las ganancias responden "Acceso no
autorizado" y modificar o crear un producto es rechazado. Lee la URL y la llave del `.env`; la
contraseña se pasa **solo en la terminal**, nunca en un archivo (PowerShell):

```powershell
$env:CSE_CLAVE_CLIENTE = "contraseña de cliente@cse.test"; npm run verificar-seguridad
```

Opcional: define también `$env:CSE_CLAVE_TRABAJADOR` para comprobar que el trabajador sí recibe el
costo (así se sabe que la prueba es significativa). Si usaste otros correos, defínelos en
`CSE_CORREO_CLIENTE` y `CSE_CORREO_TRABAJADOR`. Termina con `Resultado: 0 falla(s)` si todo está
bien; cierra la terminal al terminar para que la contraseña no quede en la sesión.

## Probar el proceso principal con dos teléfonos (Expo Go)

Necesitas dos teléfonos reales con Expo Go (Android o iPhone, pueden ser distintos) y el proyecto
corriendo con `npx expo start` en el computador. En cada teléfono escanea el QR (en iPhone, con la
cámara; en Android, desde Expo Go).

**Teléfono A: cliente (`cliente@cse.test`)**

1. Inicia sesión. Se abre la pestaña Inicio.
2. Inicio o Cotizaciones > **Solicitar cotización**: elige Instalación, describe la necesidad,
   agrega uno o dos productos de interés y envía. Aparece en la bandeja como "Por cotizar".

**Teléfono B: trabajador (`trabajador@cse.test`)**

3. Pestaña **Cotizaciones**: la solicitud aparece como Solicitada (desliza hacia abajo para
   recargar). Pulsa **Crear cotización**.
4. Agrega dos productos, ajusta las cantidades con + y −, escribe un descuento y revisa el total.
   Pulsa **Enviar**. Queda como Enviada.

**Teléfono A: cliente**

5. Desliza para recargar la bandeja: la cotización llega como **Nueva** (punto azul). Ábrela: pasa
   a **Vista** y muestra líneas, IVA, servicio y total.
6. Pulsa **Aceptar**. Se crea el pedido con el mismo total (pantalla de Confirmación de pedido).
7. Pulsa **Agendar cita**. Si no tienes ubicación, registra una: en el mapa marca el punto (o usa
   **Mi ubicación**; el permiso se pide en ese momento), escribe la dirección y guarda.
8. Elige fecha futura y franja y confirma. La cita queda **Programada** en Mis citas (Drawer).

**Teléfono B: trabajador**

9. Pestaña **Citas**: recarga y aparece la cita. Márcala como **Realizada**.
10. En el teléfono A, Mis citas muestra Realizada al recargar.

Otras pruebas rápidas: cierra la app por completo y vuelve a abrirla (la sesión, el carrito, los
pedidos y las citas siguen ahí, CP-10); activa el modo avión e intenta confirmar una compra o
agendar una cita (mensaje de error, nada se crea; al volver la conexión, Reintentar la completa,
CP-06); con el cliente, escribe en el catálogo "DVR" o filtra por "Discos duros".

## Integración continua

Cada pull request hacia `main` (y cada push a `main`) corre en GitHub Actions el flujo
`.github/workflows/ci.yml`, en Ubuntu con Node.js 26. Revisa, en orden:

1. Que no haya un `.env` versionado ni llaves secretas (`sb_secret_…`, `service_role`) con valor.
2. `npm ci`: que las dependencias se instalen tal como están en `package-lock.json`.
3. `npm run typecheck`: que TypeScript no tenga errores.
4. `npx expo-doctor`: que las versiones sean compatibles con Expo SDK 58. **Este paso no bloquea
   el PR** (`continue-on-error: true`): Expo publica parches seguido y, cuando sale uno, los
   paquetes quedan una versión atrás sin que el código esté mal. Si falla, el aviso sigue visible
   en el CI; se corrige con `npx expo install --fix` en un commit aparte.
5. `npx expo export --platform android`: que el bundle de Android compile (con valores falsos de
   Supabase, porque en GitHub no hay `.env`).

La revisión de secretos, `npm ci`, el typecheck y la compilación del bundle sí son obligatorios: si
uno falla, el PR sale en rojo.

**Si un PR sale en rojo:** abre la pestaña *Checks* del PR, entra al paso con la X y lee el error.
Repite ese mismo comando en tu computador, corrígelo y sube un commit nuevo a la misma rama: la
revisión vuelve a correr sola. Si el error es de secretos, quita el archivo con
`git rm --cached <archivo>` y cambia esa llave en Supabase, porque ya quedó en el historial.

`npm run verificar-seguridad` no corre en el CI: necesita el proyecto real de Supabase y una
contraseña, y en GitHub no se guardan.

## Opcional: generar un APK con EAS Build

No es obligatorio (la entrega se prueba con Expo Go), pero sirve para instalar la app sin Expo Go.
Necesitas una cuenta gratuita de Expo y no hace falta instalar nada en el proyecto:

1. Inicia sesión: `npx eas-cli login`.
2. Configura el proyecto: `npx eas-cli build:configure` (elige Android). Crea `eas.json`.
3. En `eas.json`, dentro de `build`, agrega un perfil que genere APK en lugar de AAB:

   ```json
   "preview": {
     "distribution": "internal",
     "android": { "buildType": "apk" }
   }
   ```

4. Las variables del `.env` no viajan a los servidores de EAS: créalas en el proyecto de Expo
   (**expo.dev > tu proyecto > Environment variables**, visibilidad "Plain text", porque son
   públicas) o con `npx eas-cli env:create`.
5. Compila: `npx eas-cli build -p android --profile preview`. Al terminar, EAS muestra un enlace y
   un QR para descargar el APK e instalarlo en el teléfono (hay que permitir "instalar apps
   desconocidas").

## Documentación

El informe del proyecto (requerimientos, reglas de negocio, matriz, pruebas, límites conocidos y
bitácora) se entrega aparte y no está en este repositorio. Este README tiene todo lo necesario para
instalar, montar el servicio y probar la app.
