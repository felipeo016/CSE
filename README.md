# Centro de Seguridad Electrónica — App móvil

Proyecto final de Desarrollo Móvil II. Aplicación para un negocio que vende, instala y mantiene
sistemas de cámaras de seguridad: catálogo, carrito, cotizaciones, mapa y citas.

Equipo: Felipe Obregón Castro y Juan Pablo Murillo Villalobos.

> Este README se completa en el prompt C1 (configuración del servicio, cuentas de prueba y pasos
> para probar el proceso principal).

## Requisitos

- [Node.js](https://nodejs.org/) 20 o superior (incluye npm).
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

## Tecnologías

React Native + TypeScript (strict) + Expo SDK 58 con Expo Router, NativeWind, Zustand,
TanStack Query, Axios, Supabase (por HTTP), OpenStreetMap + Leaflet en WebView y expo-location.

## Documentación

- `docs/documentacion-proyecto.md`: requerimientos, reglas de negocio, pantallas y pruebas.
- `docs/bitacora.md`: bitácora de avances.
- `docs/cambios-estructura.md`: cambios a la estructura de carpetas.
