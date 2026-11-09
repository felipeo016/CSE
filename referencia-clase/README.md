# Referencia de clase

Trabajos hechos en clase de Desarrollo Móvil II, copiados como **guía de consulta**. No se compilan ni se
modifican, y `tsconfig.json` del proyecto excluye esta carpeta del typecheck.

Se copiaron sin `node_modules`, `.expo`, `.git`, `.vscode`, `.env`, carpetas de compilación ni archivos de
más de 5 MB. Se revisaron y no contienen claves ni tokens.

> Los dos trabajos usan **Expo SDK 57**. Este proyecto usa **SDK 58** y la estructura de la sección 7 de
> `docs/documentacion-proyecto.md`. Si un trabajo difiere, se sigue el proyecto.

## Índice

| Carpeta | Qué es | Para qué sirve en este proyecto |
| --- | --- | --- |
| [`mapas/`](mapas/) | Ejercicio de mapas de clase, **partes 1 y 2**. Parte 1 (`app/map-simple`): mapa fijo con marcadores en Pereira e Ibagué. Parte 2 (`app/map`): posición actual con expo-location, pantalla de permisos y marcadores en Pereira y Dosquebradas. | Base del mapa (J4): componente `OpenStreetMap.tsx` con Leaflet 1.9.4 en una WebView y mensajes `ready`/`pan` hacia React Native; funciones `window.moveTo` y `window.updateUser` para mover el marcador; permisos en primer plano (`location/permissions/location.ts`); stores de Zustand con `isLoading` y `error` (`useLocationStore`, `usePermissionsStore`); tipos `LatLng` y `LocationData`. Las coordenadas de Dosquebradas se reemplazan por `COORDENADAS_NEGOCIO` (RF‑23). |
| [`explora/`](explora/) | Base del segundo parcial (Explora): catálogo de cuatro lugares, ficha por id y mapa individual. Incluye la guía de la sesión 2 en [`guia.md`](explora/guia.md). | Navegación Stack + Drawer + Tabs con grupos `(drawer)/(tabs)` (J2); ruta dinámica `detalle/[id]` con id inexistente (RF‑08, RF‑21); componentes con props y NativeWind (`RegistroCard`, `BotonAccion`); hook propio con búsqueda y filtro por categoría con `useMemo` (`useRegistros`, RF‑06 y RF‑07); mapa de un punto recibido por parámetros de ruta. |

## Temas que NO están en estos trabajos

Ninguno de los dos usa **TanStack Query**, **Axios** ni **mappers** (Mapas tiene `axios` y
`@tanstack/react-query` en `package.json`, pero el código no los usa). Tampoco hay persistencia con
AsyncStorage ni consumo de un servicio remoto. Para esos temas manda `CLAUDE.md` y la sección 7 de la
documentación: una sola instancia de Axios en `src/services/api.ts`, tipos de respuesta en
`src/types/api.types.ts`, modelos en `src/models/` y mappers en `src/mappers/`.
