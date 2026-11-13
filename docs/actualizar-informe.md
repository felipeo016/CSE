# Cambios para pasar a mano al Word de la documentación

Prompt C1 (cierre). `docs/documentacion-proyecto.md` es la copia en texto del Word y no se edita
desde el código. Esta lista dice qué cambiar en el Word (`Documentación del proyecto final.docx`)
para que el informe coincida con la app entregada. Va en el orden de las secciones.

## Portada

- **Fecha:** cambiar "[Pendiente]" por la fecha de entrega.

## Sección 3.1 — RF-03 (navegación): corregir el criterio de aceptación

La documentación se contradice entre RF-03 y las secciones 6 y 7; el equipo decidió la navegación
de CLAUDE.md. Reemplazar el criterio de aceptación de RF-03 por:

> El cliente ve en Tabs Inicio, Catálogo, Cotizaciones (bandeja) y Carrito, y en el Drawer Mis
> pedidos, Mis citas, Mis ubicaciones, Ubicación del negocio, Perfil y Cerrar sesión. El trabajador
> ve en Tabs Productos, Cotizaciones, Clientes y Citas, y en el Drawer Ubicaciones, Perfil y Cerrar
> sesión. El administrador ve todo lo del trabajador más la pestaña Panel general y la opción
> Usuarios y roles en el Drawer. Los flujos (detalle de producto, detalle de cotización, solicitar y
> crear cotización, mapa, agendar cita, confirmación y detalle de pedido y los formularios) se
> abren en Stack y el botón atrás regresa a la pantalla anterior. Ningún botón o ícono queda sin
> acción y no hay rutas rotas; un rol que abre por ruta una pantalla ajena ve "Acceso no
> autorizado".

## Secciones 3 y 4 — "[Por confirmar con el cliente]"

Donde un requerimiento dice "[Por confirmar con el cliente]", agregar entre paréntesis el valor de
prueba que usa la app, tomado de `docs/valores-por-confirmar.md` (por ejemplo, RF-12: "IVA 19 %
sobre subtotal − descuento; instalación 150 000 COP y mantenimiento 80 000 COP, valores de prueba").

## RNF-01, RNF-04 y sección 10 — "teléfono Android" → "teléfono real con Expo Go"

La app se probó en Android y en iPhone con Expo Go. Cambiar:

- **RNF-01, criterio:** "En un teléfono Android, un usuario…" → "En un teléfono real con Expo Go
  (Android o iPhone), un usuario…".
- **RNF-04, descripción:** "La app funciona en Android con Expo…" → "La app funciona en teléfonos
  reales con Expo Go (Android o iPhone), usando…". **Criterio:** "…se ejecuta en un teléfono
  Android real sin errores" → "…se ejecuta en un teléfono real con Expo Go sin errores".
- **Sección 10, primer párrafo:** "Probaremos la app en un teléfono Android real con Expo…" →
  "Probamos la app en teléfonos reales con Expo Go (Android y iPhone)…".
- **Sección 12, último párrafo:** "solo la probaremos en Android" → "la probamos en teléfonos
  reales con Expo Go".

## RNF-10 y sección 9 — servicio remoto elegido y sus límites

- **RNF-10:** "Servicio a utilizar: [Por definir por el equipo]" → "Servicio: Supabase (PostgreSQL
  en la nube con API REST, Auth, RPC y Edge Functions), consumido solo por HTTP con Axios".
- **Sección 9, segundo párrafo:** cambiar "[Servicio por definir]" por "Supabase".
- **Sección 9, último párrafo:** reemplazar "Documentaremos los límites exactos cuando elijamos el
  servicio…" por un párrafo como este:

> Elegimos Supabase porque guarda los datos en una base PostgreSQL compartida por todos los
> teléfonos, se consume por HTTP con Axios y aplica la seguridad en el servidor: con Row Level
> Security cada rol solo recibe sus filas y el cliente nunca recibe el costo, porque su catálogo
> sale de una vista sin esa columna. Las reglas que no pueden fallar (descontar inventario, calcular
> totales, aceptar una cotización, no repetir una compra) se ejecutan en funciones transaccionales
> de la base. Límites: todo cambio requiere conexión (sin ella la app muestra la caché con un aviso
> y no confirma nada); los cambios se ven al recargar, no en tiempo real; el plan gratuito tiene
> cuotas de almacenamiento y transferencia y pausa el proyecto tras una semana sin uso; no incluye
> la protección contra contraseñas filtradas. La sesión y el carrito se guardan en el teléfono con
> AsyncStorage (Zustand persist).

## Sección 7 — árbol real del código

Reemplazar el árbol propuesto por el real (los cambios y su motivo están en
`docs/cambios-estructura.md`), y la frase "La actualizaremos cuando tengamos la versión final del
código" por "Esta es la estructura de la versión entregada":

```text
app/
    _layout.tsx (Stack raíz) · index.tsx (inicio de la app)
    (auth)/ _layout · login · registro
    (cliente)/
        (drawer)/ _layout (Drawer) · mis-pedidos · mis-citas · mis-ubicaciones · ubicacion-negocio · perfil
            (tabs)/ _layout · inicio · catalogo · cotizaciones · carrito
        flujos/ solicitar-cotizacion · mapa (compartido) · agendar-cita · confirmacion-pedido · pedido/[id]
    (trabajador)/
        (drawer)/ _layout (Drawer) · ubicaciones · perfil · usuarios (admin)
            (tabs)/ _layout · productos · cotizaciones · clientes · citas · panel (admin)
        flujos/ producto-form · cliente-form · cliente/[id] · cotizacion-form · ubicacion-form · usuario-form (admin)
    producto/[id].tsx · cotizacion/[id].tsx
src/
    components/ 53 componentes; entre ellos TarjetaProducto · Boton · EstadoVista · ContadorCantidad
                · MapaLeaflet · CampoTexto · RutaProtegida · ResumenCarrito · TarjetaCotizacion
    hooks/ useProductos · useCotizaciones · useCalculoTotal · useUbicacion · useClientes · useCitas
           · usePedidos · useUbicaciones · useParametros · usePerfil · useUsuarios · useVentas
           · useEnLinea · useRetraso · useRecargarAlVolver · useRequiereRol · useCerrarSesion
           · useEliminarProducto
    services/ api · queryClient · auth · productos · cotizaciones · pedidos · citas · clientes
              · ubicaciones · parametros · usuarios · ventas
    types/ api.types · props.types
    models/ Producto · Cotizacion · Pedido · Cita · Ubicacion · Usuario · Cliente · Carrito
            · Calculo · FormularioCotizacion · Mapa · ParametrosNegocio · Ventas
    mappers/ producto · cotizacion · pedido · cita · ubicacion · usuario · cliente · parametros · ventas
    store/ sesionStore · carritoStore · mapaStore
    utils/ calculos · validaciones · carrito · catalogo · citas · clientes · consultas · coordenadas
           · cotizacionForm · formato · navegacion · panel · precios · texto · ventas
    config/ colores · encabezados · filtrosCatalogo · menus · pestanas · valoresPrueba
assets/ fonts/ (Poppins e Inter) · images/ · mapa/leafletHtml.ts
supabase/ migrations/ 001 a 009 · seed/ datos_prueba · inventario_inicial · functions/admin-usuarios
scripts/ depurar-inventario.mjs · verificar-seguridad.mjs
.env.template · package.json · package-lock.json · .github/workflows/ci.yml
```

Cambios frente al árbol propuesto que conviene mencionar en el párrafo siguiente:

- El Drawer de cada rol está en `(drawer)/_layout.tsx`, no en `(cliente)/_layout`, para que los
  flujos queden en el Stack raíz y el botón atrás regrese a la pestaña de partida.
- No hay carpeta `(admin)`: Panel general es una pestaña y Usuarios y roles una opción del Drawer
  del trabajador, visibles solo para el administrador.
- Se agregaron Ubicación del negocio, Detalle de pedido y Formulario de usuario.
- El HTML de Leaflet es `assets/mapa/leafletHtml.ts` (Expo Go no lee un `.html` local sin otra
  librería).
- `src/config/` guarda colores, menús, pestañas y valores de prueba.

## Sección 6 — mapa de pantallas

Agregar tres filas:

| Pantalla | Rol | Navegación | Propósito |
| --- | --- | --- | --- |
| Ubicación del negocio | Cliente | Drawer | Mapa con el marcador del negocio (RF-23). |
| Detalle de pedido | Cliente | Stack | Ruta /flujos/pedido/[id] con las líneas, el total y el estado del pedido (RF-14). |
| Formulario de usuario | Administrador | Stack | Creación y edición de usuarios con su rol (RF-34). |

En el párrafo de rutas dinámicas: "Tenemos tres rutas dinámicas por identificador: /producto/[id],
/cotizacion/[id] y /flujos/pedido/[id]…" (más /flujos/cliente/[id] del personal).

## Sección 8 — matriz de requisitos con los archivos reales

Reemplazar la columna "Archivo propuesto" por "Archivo" y usar estas filas. En "Evidencia" van los
casos de prueba de la sección 10, las capturas de `docs/evidencias/` y el PR de la bitácora.

| Requisito | Función en la app | Pantalla | Archivo | RF / RNF | Evidencia |
| --- | --- | --- | --- | --- | --- |
| React Native, TypeScript y Expo | Proyecto Expo SDK 58 con dependencias fijadas | Todas | package.json, package-lock.json, tsconfig.json | RNF-04 | `npm run typecheck`, `npx expo-doctor` y CI (PR) |
| Organización del código | Rutas, pantallas, componentes, hooks, servicios, tipos y modelos separados | Todas | app/, src/ | RNF-11 | Árbol de la sección 7 |
| Tipos sin any | Tipos para entidades, props, respuestas y resultados | Todas | src/types/api.types.ts, src/types/props.types.ts, src/models/ | RNF-12 | Búsqueda de "any" sin resultados; typecheck |
| Navegación Stack | Flujos con retroceso | Detalle de producto, Crear cotización, Agendar cita | app/_layout.tsx | RF-03 | Demostración |
| Navegación Tabs | Secciones frecuentes de cada rol | Pestañas de cliente y trabajador | app/(cliente)/(drawer)/(tabs)/_layout.tsx, app/(trabajador)/(drawer)/(tabs)/_layout.tsx, src/config/pestanas.ts | RF-03 | Demostración |
| Navegación Drawer | Accesos complementarios | Mis pedidos, Mis citas, Perfil, Usuarios y roles | app/(cliente)/(drawer)/_layout.tsx, app/(trabajador)/(drawer)/_layout.tsx, src/components/MenuLateral.tsx, src/config/menus.ts | RF-03 | Demostración |
| Ruta dinámica | Detalle por identificador con "no encontrado" | Detalle de producto, de cotización y de pedido | app/producto/[id].tsx, app/cotizacion/[id].tsx, app/(cliente)/flujos/pedido/[id].tsx | RF-08, RF-21 | CP-09 |
| Control de acceso por rol | "Acceso no autorizado" por ruta directa | Usuarios y roles, Panel | src/components/RutaProtegida.tsx, src/hooks/useRequiereRol.ts, supabase/migrations/002_seguridad.sql | RF-34, RNF-05 | CP-12; `npm run verificar-seguridad`; docs/evidencias/f2-05, f2-07 |
| NativeWind, fuente personalizada y áreas seguras | Estilos del mockup, Poppins e Inter, imagen alternativa | Todas | tailwind.config.js, global.css, app/_layout.tsx, assets/fonts/, src/components/ImagenProducto.tsx | RNF-01, RNF-02 | Demostración |
| Componentes reutilizables | Tarjeta de producto, botón y estado de carga, error o vacío | Catálogo, Carrito, Cotizaciones y demás | src/components/TarjetaProducto.tsx, Boton.tsx, EstadoVista.tsx | RF-09 | Demostración |
| Búsqueda o filtro | Búsqueda y filtros del catálogo; filtro de cotizaciones; búsqueda de clientes sin tildes | Catálogo, Cotizaciones, Clientes | app/(cliente)/(drawer)/(tabs)/catalogo.tsx, src/utils/catalogo.ts, src/utils/clientes.ts, src/utils/texto.ts | RF-06, RF-07, RF-19, RF-33 | Demostración |
| useState y useEffect | Filtros, formularios y seguimiento de ubicación | Catálogo, Crear cotización, Mapa | catalogo.tsx, app/(trabajador)/flujos/cotizacion-form.tsx, src/hooks/useUbicacion.ts | RF-07, RF-16, RF-25 | Demostración |
| Hook propio | Cálculo del total y seguimiento de ubicación | Carrito, Crear cotización, Mapa | src/hooks/useCalculoTotal.ts, src/hooks/useUbicacion.ts | RF-12, RF-17, RF-25 | Demostración |
| Zustand | Sesión, carrito y mapa compartidos | Carrito, Mapa, todas (sesión) | src/store/sesionStore.ts, carritoStore.ts, mapaStore.ts | RF-04, RF-11 | CP-10 |
| Contador contextual | Cantidades limitadas por el inventario | Detalle de producto, Carrito, Crear cotización | src/components/ContadorCantidad.tsx | RF-10, RF-16 | CP-07; docs/evidencias/f2-10-cp07-inventario-insuficiente.png |
| Cálculo contextual | Subtotal, descuento, IVA y servicio | Carrito, Crear cotización | src/utils/calculos.ts, src/hooks/useCalculoTotal.ts | RF-12, RF-17 | CP-08 |
| Formulario con validaciones | Login, registro, solicitud, producto, cliente, cotización, ubicación, cita, usuario | Varias | src/utils/validaciones.ts, src/components/CampoTexto.tsx | RF-01, RF-15, RF-27, RF-29 | CP-08 |
| Axios con configuración centralizada | Instancia única con baseURL, apikey, token y errores | Todas las que usan datos remotos | src/services/api.ts | RF-05, RNF-11 | Revisión del código |
| Consulta de listado y de detalle | Catálogo y detalle de producto | Catálogo, Detalle de producto | src/services/productos.service.ts | RF-05, RF-08 | Demostración |
| Interfaces, modelos y mapper | Respuesta del servicio → modelo interno | Catálogo, Cotizaciones | src/types/api.types.ts, src/models/, src/mappers/ | RF-05, RF-20, RNF-06 | Revisión del código |
| TanStack Query | Consultas con queryKey, staleTime/gcTime, estados y Reintentar | Catálogo, Cotizaciones y demás | src/hooks/useProductos.ts, src/hooks/useCotizaciones.ts, src/services/queryClient.ts | RF-05, RF-20, RNF-03 | Demostración |
| Conservación de datos | Pedidos, cotizaciones, citas y ubicaciones en Supabase | Mis pedidos, Mis citas, Cotizaciones | src/services/, supabase/migrations/ | RNF-09, RNF-10 | CP-10; docs/evidencias/cp01-pedido-confirmado.png |
| Confidencialidad del costo | El cliente nunca recibe costo ni ganancia | Catálogo, Detalle de cotización | supabase/migrations/002_seguridad.sql, 007, 009, src/mappers/producto.mapper.ts, scripts/verificar-seguridad.mjs | RNF-06 | CP-11; `npm run verificar-seguridad`; docs/evidencias/f2-02, f2-03, f2-06 |
| Mapa con OpenStreetMap y Leaflet | Negocio, ubicación de servicio y posición del dispositivo | Mapa, Ubicación del negocio | src/components/MapaLeaflet.tsx, assets/mapa/leafletHtml.ts | RF-23, RF-26 | Demostración |
| Ubicación con expo-location y permisos | Posición actual, permiso negado, regreso de Ajustes y GPS apagado | Mapa | src/hooks/useUbicacion.ts | RF-24, RNF-13 | CP-02, CP-03, CP-04 |
| Seguimiento y liberación de suscripciones | Activar, pausar y reanudar; detener al salir | Mapa | src/hooks/useUbicacion.ts, src/components/PanelSeguimiento.tsx | RF-25, RNF-14 | CP-05 |
| Uso sin conexión | Aviso, sin confirmaciones falsas y Reintentar | Todas las que usan datos remotos | src/services/api.ts, src/hooks/useEnLinea.ts, src/components/AvisoConexion.tsx | RNF-08 | CP-06 |
| Integridad del inventario | Inventario no negativo, código único, compras simultáneas y carga del Excel | Carrito, Productos | supabase/migrations/001, 003, 008, scripts/depurar-inventario.mjs | RNF-15, RF-32 | docs/evidencias/f7-carga-inventario.txt, f-008-compras-citas.txt |
| Configuración y credenciales | Plantilla de variables sin secretos; revisión en CI | No aplica | .env.template, .github/workflows/ci.yml | RNF-07 | CI (paso "Revisar que no se suban secretos") |

## Sección 10 — resultados de las pruebas

Completar "Resultado obtenido" y "Evidencia" de CP-01 a CP-12 con lo anotado en
`docs/bitacora.md` (pruebas en teléfono de J4 a F8) y las capturas de `docs/evidencias/`. CP-11
ahora también se comprueba con `npm run verificar-seguridad` (pegar la salida como evidencia).

## Sección 12 — límites conocidos y valores de prueba

- Reemplazar el segundo párrafo ("Hay funciones que dependen de decisiones pendientes…
  trabajaremos con valores de prueba…") por los valores concretos que usa la app: IVA 19 %,
  instalación 150 000 COP, mantenimiento 80 000 COP, vigencia 15 días (tabla `parametros_negocio`);
  citas de lunes a sábado en cuatro franjas (08:00–10:00, 10:00–12:00, 14:00–16:00, 16:00–18:00)
  sin límite de cupos; coordenadas del negocio de prueba; stock bajo de 1 a 2 unidades; cada
  cliente instalador o final (por defecto final) ve el precio de su tipo; el personal ve ambos
  precios y el costo; no se reserva inventario durante la cotización; y las reglas de depuración
  del Excel (duplicados → hoja más reciente, sin código → SIN-COD-001…, negativo → 0). Detalle en
  `docs/valores-por-confirmar.md`.
- Agregar los límites de `docs/limites-conocidos.md` que no están (resumidos): pausa del plan
  gratuito, sin Leaked Password Protection, producto desactivado sin reactivar desde la app,
  contraseña temporal sin cambio obligatorio, el trabajador no abre el detalle de un pedido, costo
  de los pedidos anteriores a la 009, carrito con un producto desactivado, ejecutar dos veces la
  carga del inventario y pedido solo en estado Pendiente.

## Decisiones del equipo: migraciones 007, 008 y 009

Agregarlas (por ejemplo en la sección 5 o en un apartado "Decisiones del equipo") como decisiones
que no estaban en la documentación original:

- **007 — La cotización en preparación no se le muestra al cliente.** Mientras la cotización está
  Solicitada o en Borrador, el cliente la ve como "Por cotizar", sin líneas, precios ni total;
  solo al enviarla llega a su bandeja con todo el detalle (RF-18). Motivo: un borrador puede
  cambiar y el cliente no debe aceptar valores que el trabajador aún no confirma.
- **008 — Una compra no se registra dos veces y las citas no se repiten.** Cada compra del carrito
  lleva un identificador único (expo-crypto); si la respuesta tarda y el cliente pulsa Reintentar,
  el servidor devuelve el mismo pedido en vez de crear otro y descontar inventario dos veces
  (RNF-08, RNF-15). Además, un cliente no puede tener dos citas programadas en el mismo día y
  franja, ni agendar una franja de hoy que ya pasó (hora de Colombia).
- **009 — La ganancia usa el costo del momento de la venta.** Cada línea de pedido guarda su costo
  en una tabla que el cliente no puede leer; así, si el trabajador cambia el costo de un producto,
  las ganancias de meses anteriores no cambian (RF-35, RNF-06). Los pedidos anteriores a 009 quedaron
  con el costo vigente al aplicarla.

## Sección 13 — bitácora

Copiar las filas de `docs/bitacora.md` (F1 a C1) en la tabla y quitar las tres filas
"[Pendiente]" de los hitos 2, 3 y 4, que ya quedaron cubiertas por las filas con fecha.
