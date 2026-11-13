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

La guía completa, con capturas de qué revisar en cada paso, está en `docs/servicio-remoto.md`
(secciones 2, 10 y 11). Resumen:

1. Crea un proyecto en <https://supabase.com/dashboard> (región São Paulo o Norte de Virginia).
2. En **SQL Editor > New query** ejecuta, uno por uno y en este orden, los archivos de
   `supabase/migrations/`:
   `001_esquema.sql`, `002_seguridad.sql`, `003_funciones.sql`, `004_ajustes_seguridad.sql`,
   `005_solicitud_cotizacion.sql`, `006_borrador_cotizacion.sql`,
   `007_borrador_oculto_cliente.sql`, `008_compras_y_citas.sql` y `009_costo_ventas.sql`.
   (No hay migración 010: los mensajes del servidor que estaban en "usted" se pasan a "tú" en la
   app, en `src/services/api.ts`.)
3. Ejecuta la **parte 1** de `supabase/seed/datos_prueba.sql` (productos de prueba).
4. Crea los usuarios de prueba en **Authentication > Users > Add user > Create new user**, con
   **Auto Confirm User** marcado: `cliente@cse.test`, `trabajador@cse.test` y `admin@cse.test`.
   Elige tú las contraseñas y guárdalas fuera del repositorio.
5. Ejecuta las **partes 2 y 3** de `supabase/seed/datos_prueba.sql` (roles de trabajador y
   administrador, y un "Otro cliente" para comprobar que un cliente no ve lo ajeno).
6. Carga el inventario real: pega todo `supabase/seed/inventario_inicial.sql` en el SQL Editor y
   ejecútalo **una sola vez**. Debe terminar con `Carga correcta: 76 productos del Excel`.
7. Edge Function `admin-usuarios` (Usuarios y roles):
   1. **Project Settings > API Keys > Secret keys > Add new secret key** (por ejemplo
      `admin_usuarios`) y copia la llave `sb_secret_...`.
   2. **Edge Functions > Secrets > Add new secret**: nombre `CSE_LLAVE_SECRETA`, valor esa llave.
   3. **Edge Functions > Deploy a new function > Via Editor**, nombre `admin-usuarios`, pega todo
      `supabase/functions/admin-usuarios/index.ts` y publícala.
   4. En la función, apaga **Verify JWT with legacy secret** y guarda.

   La llave secreta solo va en ese secreto: **nunca** en el `.env`, en el código ni en Git.
8. **Authentication > Sign In / Providers > Email**: apaga **Confirm email**. Así quien se registra
   desde la app puede iniciar sesión enseguida (la app no envía correos).
9. **Advisors > Security Advisor**: debe dar 0 errores y 13 advertencias aceptadas (explicadas en
   `docs/servicio-remoto.md`, sección 9).

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
`baseURL = EXPO_PUBLIC_SUPABASE_URL`, el encabezado `apikey` con la publishable key y, con sesión,
`Authorization: Bearer <token del usuario>`. Rutas usadas: `/auth/v1` (inicio de sesión y
registro), `/rest/v1` (tablas, vistas y funciones RPC) y `/functions/v1/admin-usuarios`. La lista
completa está en `docs/servicio-remoto.md`, sección 4.

## Comandos

| Comando | Para qué sirve |
| --- | --- |
| `npx expo start` (o `npm start`) | Arranca la app; se abre en Expo Go escaneando el QR. |
| `npx expo start --tunnel` | Igual, pero sin estar en la misma Wi‑Fi (redes que bloquean la conexión). |
| `npx expo start --clear` | Arranca limpiando la caché (después de cambiar `.env` o `tailwind.config.js`). |
| `npm run typecheck` | Revisa los tipos de TypeScript sin generar archivos. Debe terminar sin errores. |
| `npx expo-doctor` | Revisa que las dependencias sean compatibles con Expo SDK 58. |
| `npm run depurar-inventario` | Lee `datos/inventario.xlsx` y regenera `docs/depuracion-inventario.md` y `supabase/seed/inventario_inicial.sql`. No se conecta a Supabase. |
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

- `docs/documentacion-proyecto.md`: requerimientos, reglas de negocio, pantallas y pruebas.
- `docs/servicio-remoto.md`: Supabase (montaje, URLs, seguridad, límites, carga del inventario).
- `docs/limites-conocidos.md`: lo que la versión entregada no hace y cómo se resolvería.
- `docs/valores-por-confirmar.md`: valores de prueba y casos del Excel para confirmar con el cliente.
- `docs/actualizar-informe.md`: cambios que hay que pasar a mano al Word de la documentación.
- `docs/depuracion-inventario.md`: informe de la depuración del Excel (RF-32).
- `docs/cambios-estructura.md`: cambios a la estructura de carpetas.
- `docs/bitacora.md`: bitácora de avances.
