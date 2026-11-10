# Centro de Seguridad Electrónica — App móvil

Proyecto final de Desarrollo Móvil II. Aplicación para un negocio que vende, instala y mantiene
sistemas de cámaras de seguridad: catálogo, carrito, cotizaciones, mapa y citas.

Equipo: Felipe Obregón Castro y Juan Pablo Murillo Villalobos.

> Este README se completa en el prompt C1 (configuración del servicio, cuentas de prueba y pasos
> para probar el proceso principal).

## Requisitos

- [Node.js](https://nodejs.org/) 22 (desde 22.13), 24 (desde 24.3) o 26 en adelante; Expo SDK 58 no acepta otras versiones. El CI usa Node 26.
- Git.
- Un teléfono Android con la app **Expo Go** (Play Store), compatible con **Expo SDK 58**.
- El computador y el teléfono conectados a la misma red Wi-Fi.

## Instalación

```bash
git clone <url-del-repositorio>
cd CSE
npm install
```

Crea el archivo de variables de entorno a partir de la plantilla y completa los valores
(las instrucciones están dentro del archivo):

```bash
cp .env.template .env
```

## Ejecución en Android con Expo Go

```bash
npx expo start
```

1. Abre Expo Go en el teléfono.
2. Escanea el código QR que aparece en la terminal.
3. Si el teléfono no encuentra el servidor (red de la universidad), usa `npx expo start --tunnel`.

## Comandos útiles

| Comando | Para qué sirve |
| --- | --- |
| `npm run typecheck` | Revisa los tipos de TypeScript sin generar archivos. |
| `npx expo start --clear` | Arranca limpiando la caché (después de cambiar `.env` o `tailwind.config.js`). |

## Integración continua

Cada pull request hacia `main` (y cada push a `main`) corre en GitHub Actions el flujo
`.github/workflows/ci.yml`, en Ubuntu con Node.js 26. Revisa, en orden:

1. Que no haya un `.env` versionado ni llaves secretas (`sb_secret_…`, `service_role`) con valor.
2. `npm ci`: que las dependencias se instalen tal como están en `package-lock.json`.
3. `npm run typecheck`: que TypeScript no tenga errores.
4. `npx expo-doctor`: que las versiones sean compatibles con Expo SDK 58.
5. `npx expo export --platform android`: que el bundle de Android compile (con valores falsos de
   Supabase, porque en GitHub no hay `.env`).

**Si un PR sale en rojo:** abre la pestaña *Checks* del PR, entra al paso con la X y lee el error.
Repite ese mismo comando en tu computador, corrígelo y sube un commit nuevo a la misma rama: la
revisión vuelve a correr sola. Si el error es de secretos, quita el archivo con
`git rm --cached <archivo>` y cambia esa llave en Supabase, porque ya quedó en el historial.

## Tecnologías

React Native + TypeScript (strict) + Expo SDK 58 con Expo Router, NativeWind, Zustand,
TanStack Query, Axios, Supabase (por HTTP), OpenStreetMap + Leaflet en WebView y expo-location.

## Documentación

- `docs/documentacion-proyecto.md`: requerimientos, reglas de negocio, pantallas y pruebas.
- `docs/bitacora.md`: bitácora de avances.
- `docs/cambios-estructura.md`: cambios a la estructura de carpetas.
