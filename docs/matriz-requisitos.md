# Matriz de requisitos

Prompt C2 (cierre). Matriz de la sección 8 de `docs/documentacion-proyecto.md` con los archivos
reales, el PR donde se hizo y la evidencia; y, en la parte B, cada RF y RNF con su estado.

Estados:

- **Cumplido**: implementado y con prueba registrada en `docs/bitacora.md`, `docs/evidencias/` o en la revisión del PR (comprobada a la vista en iPhone con Expo Go, sin captura, cuando así se indica).
- **Cumplido, falta probar**: implementado y revisado (typecheck, bundle), pero sin prueba en el
  teléfono registrada; ver `docs/pruebas.md`.
- **Parcial**: cumple el criterio con una parte por confirmar o que no se hizo.
- **Límite conocido**: la parte que falta está explicada en `docs/limites-conocidos.md` (LC).

Los PR son del repositorio `felipeo016` en GitHub: #1 F1 base · #2 referencia de clase · #3 F2
Supabase · #4 J1 · #5 F3 sesión · #6 CI · #7 F4 productos · #8 J2 navegación · #9 F5 clientes y
solicitud · #10 J3 catálogo y carrito · #11 F6 cotización · #12 J4 mapa · #13 J5 bandeja ·
#14 migración 007 · #15 F7 inventario · #16 J6 pedidos y citas · #17 J7 productos · #18 migración
008 · #19 F8 administración · #20 corrección de filtros · #21 C1 auditoría.

## A. Requisitos de los lineamientos (sección 8)

| Requisito | Función en la app | Pantalla | Archivo | RF / RNF | PR | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| React Native, TypeScript y Expo | Proyecto Expo SDK 58, TypeScript strict, dependencias fijadas | Todas | `package.json`, `package-lock.json`, `tsconfig.json`, `app.json` | RNF-04 | #1, #11, #21 | `npm run typecheck`, `npx expo-doctor` 20/20 y bundle de Android (bitácora C1); CI en cada PR |
| Organización del código | Rutas en `app/`, lógica en `src/` por responsabilidad | Todas | `app/`, `src/` (components, hooks, services, types, models, mappers, store, utils, config) | RNF-11 | #1, #8 | Árbol en `docs/actualizar-informe.md` (sección 7); cambios en `docs/cambios-estructura.md` |
| Tipos sin any | Tipos de entidades, props, respuestas y resultados | Todas | `src/types/api.types.ts`, `src/types/props.types.ts`, `src/models/` | RNF-12 | Todos | Typecheck sin errores; búsqueda de `any` sin usos (bitácora C1) |
| Navegación Stack | Flujos con retroceso a la pestaña de partida | Detalle de producto, Crear cotización, Agendar cita | `app/_layout.tsx` | RF-03 | #8 | Bitácora J2; CP-01 |
| Navegación Tabs | Secciones frecuentes por rol | Pestañas del cliente y del trabajador | `app/(cliente)/(drawer)/(tabs)/_layout.tsx`, `app/(trabajador)/(drawer)/(tabs)/_layout.tsx`, `src/config/pestanas.ts`, `src/components/IconoPestana.tsx` | RF-03 | #4, #8, #10 | Bitácora J1, J2, J3 |
| Navegación Drawer | Accesos complementarios | Mis pedidos, Mis citas, Ubicaciones, Perfil, Usuarios y roles | `app/(cliente)/(drawer)/_layout.tsx`, `app/(trabajador)/(drawer)/_layout.tsx`, `src/components/MenuLateral.tsx`, `src/config/menus.ts` | RF-03 | #8 | Bitácora J2 |
| Ruta dinámica | Detalle por identificador con "no encontrado" | Detalle de producto, de cotización, de pedido y de cliente | `app/producto/[id].tsx`, `app/cotizacion/[id].tsx`, `app/(cliente)/flujos/pedido/[id].tsx`, `app/(trabajador)/flujos/cliente/[id].tsx` | RF-08, RF-21 | #9, #10, #13, #16 | CP-09 (cotización aprobada; producto pendiente en el teléfono) |
| NativeWind, fuente personalizada y áreas seguras | Tema del mockup, Poppins e Inter, imagen alternativa | Todas | `tailwind.config.js`, `global.css`, `app/_layout.tsx` (`useFonts`, `SafeAreaProvider`), `assets/fonts/`, `src/components/ImagenProducto.tsx`, `src/config/colores.ts` | RNF-01, RNF-02 | #1, #4, #10 | Bitácora F1, J1, J3 |
| Componentes reutilizables | Tarjeta de producto, botón y estado de carga, error o vacío (53 componentes en total) | Catálogo, Carrito, Cotizaciones, Productos y demás | `src/components/TarjetaProducto.tsx`, `src/components/Boton.tsx`, `src/components/EstadoVista.tsx`, props en `src/types/props.types.ts` | RF-09 | #4, #10 | Bitácora J1, J3 |
| Búsqueda o filtro | Búsqueda sin tildes y filtros de categoría y marca; filtros de cotizaciones y citas; búsqueda de clientes | Catálogo, Cotizaciones, Clientes, Citas, Productos | `app/(cliente)/(drawer)/(tabs)/catalogo.tsx`, `src/utils/catalogo.ts`, `src/utils/texto.ts`, `src/utils/clientes.ts`, `src/components/FilaChips.tsx`, `src/components/BarraBusqueda.tsx` | RF-06, RF-07, RF-19, RF-33 | #9, #10, #11, #20, #21 | Bitácora F6 (PR #11), fix-filtros (iPhone, tres cuentas) |
| useState y useEffect | Filtros, formularios, seguimiento de ubicación, marcar vista | Catálogo, Crear cotización, Mapa, Detalle de cotización | `app/(cliente)/(drawer)/(tabs)/catalogo.tsx`, `app/(trabajador)/flujos/cotizacion-form.tsx`, `src/hooks/useUbicacion.ts`, `app/cotizacion/[id].tsx` | RF-07, RF-16, RF-25 | #10, #11, #12, #13 | Revisión del código; CP-05 (PR #12) |
| Hook propio | Cálculo del total y ubicación del dispositivo | Carrito, Crear cotización, Mapa | `src/hooks/useCalculoTotal.ts`, `src/hooks/useUbicacion.ts` (con JSDoc de entradas, estado, efectos y resultado) | RF-12, RF-17, RF-25 | #10, #11, #12 | Script de J3 (574.830); CP-08; CP-02 a CP-05 (PR #12) |
| Zustand | Sesión, carrito y mapa compartidos | Todas (sesión), Carrito, Mapa | `src/store/sesionStore.ts`, `src/store/carritoStore.ts`, `src/store/mapaStore.ts` | RF-04, RF-11 | #5, #10, #12, #18 | CP-10 (PR #16); prueba de 008 (carrito sobrevive al cierre) |
| Contador contextual | Cantidad limitada por el inventario | Detalle de producto, Carrito, Crear cotización | `src/components/ContadorCantidad.tsx` | RF-10, RF-16 | #10, #11 | CP-07 (revisión del PR #10); `f2-10-cp07-inventario-insuficiente.png` |
| Cálculo contextual | Subtotal, descuento, IVA y servicio con la fórmula del servidor | Carrito, Crear cotización | `src/utils/calculos.ts`, `src/hooks/useCalculoTotal.ts`, `supabase/migrations/003_funciones.sql` | RF-12, RF-17 | #3, #10, #11 | CP-08 cotización; CP-01 (mismo total en app y servidor, bitácora F6) |
| Formulario con validaciones | Login, registro, solicitud, producto, cliente, cotización, ubicación, cita y usuario | Varias | `src/utils/validaciones.ts`, `src/components/CampoTexto.tsx` | RF-01, RF-15, RF-27, RF-29 | #4, #5, #9, #11, #12, #16, #17, #19 | CP-08 (PR #11 y #17); bitácora F8 (usuarios) |
| Axios con configuración centralizada | Instancia única con baseURL, apikey, token, renovación e interceptores de error | Todas las que usan datos remotos | `src/services/api.ts` | RF-05, RNF-11 | #5, #21 | Revisión del código; bitácora F3 |
| Consulta de listado y de detalle | Catálogo y detalle de producto | Catálogo, Detalle de producto | `src/services/productos.service.ts` | RF-05, RF-08 | #7 | `f4-prueba-productos.txt` |
| Interfaces, modelos y mapper | Respuesta del servicio → modelo interno | Catálogo, Cotizaciones y demás | `src/types/api.types.ts`, `src/models/`, `src/mappers/` (9 mappers) | RF-05, RF-20, RNF-06 | #5, #7, #9, #13, #14 | `f4-prueba-productos.txt` (modelo del cliente sin costo) |
| TanStack Query | queryKey por recurso, staleTime/gcTime, estados y Reintentar | Catálogo, Cotizaciones y demás | `src/services/queryClient.ts`, `src/hooks/useProductos.ts`, `src/hooks/useCotizaciones.ts` y demás hooks de `src/hooks/` | RF-05, RF-20, RNF-03 | #1, #7, #9, #21 | Bitácora F4, C1 |
| Conservación de datos | Pedidos, cotizaciones, citas y ubicaciones en Supabase; sesión y carrito en AsyncStorage | Mis pedidos, Mis citas, Cotizaciones | `src/services/`, `supabase/migrations/`, `src/store/` | RNF-09, RNF-10 | #3, #5, #10, #16 | CP-01 (dos dispositivos, PR #13 y #16); `cp01-pedido-confirmado.png`; CP-10 (PR #16) |
| Mapa con OpenStreetMap y Leaflet | Negocio, ubicaciones de servicio y posición del dispositivo | Mapa, Ubicación del negocio, Mis ubicaciones, Ubicaciones | `src/components/MapaLeaflet.tsx`, `assets/mapa/leafletHtml.ts`, `app/(cliente)/flujos/mapa.tsx` | RF-23, RF-26 | #12 | Bitácora J4; CP-02 a CP-05 (PR #12) |
| Ubicación con expo-location y permisos | Posición actual, permiso negado, regreso de Ajustes y GPS apagado | Mapa | `src/hooks/useUbicacion.ts`, `src/components/AvisoUbicacion.tsx` | RF-24, RNF-13 | #12 | CP-02, CP-03, CP-04 (revisión del PR #12, iPhone, sin captura) |
| Seguimiento y liberación de suscripciones | Activar, pausar, reanudar y detener al salir | Mapa | `src/hooks/useUbicacion.ts`, `src/components/PanelSeguimiento.tsx` | RF-25, RNF-14 | #12 | CP-05 (revisión del PR #12, iPhone, sin captura) |
| Uso sin conexión | Aviso, sin confirmaciones falsas y Reintentar | Todas las que usan datos remotos | `src/services/api.ts`, `src/hooks/useEnLinea.ts`, `src/components/AvisoConexion.tsx`, `src/components/AvisoErrorAccion.tsx` | RNF-08 | #5, #11, #13, #16, #18, #21 | CP-06 |
| Control de acceso por rol | "Acceso no autorizado" por ruta directa y RLS en el servidor | Usuarios y roles, Panel | `src/components/RutaProtegida.tsx`, `src/hooks/useRequiereRol.ts`, `supabase/migrations/002_seguridad.sql` | RF-34, RNF-05 | #3, #8, #10, #19 | CP-12; `c1-verificar-seguridad.txt` |
| Configuración y credenciales | Plantilla sin secretos; revisión de secretos en CI | No aplica | `.env.template`, `.gitignore`, `.github/workflows/ci.yml`, `scripts/verificar-seguridad.mjs` | RNF-07 | #1, #6, #21 | CI (paso de secretos); revisión del historial (bitácora C1) |

## B. Requerimientos funcionales

| RF | Nombre | Archivos principales | PR | Evidencia | Estado |
| --- | --- | --- | --- | --- | --- |
| RF-01 | Inicio de sesión | `app/(auth)/login.tsx`, `src/services/auth.service.ts`, `src/mappers/usuario.mapper.ts`, `src/store/sesionStore.ts` | #4, #5 | Bitácora F3; F8 (usuario nuevo inicia sesión, cuenta desactivada) | Cumplido |
| RF-02 | Registro de cliente | `app/(auth)/registro.tsx`, `src/services/auth.service.ts` | #4, #5 | Bitácora F3 | Cumplido. Autorregistro: valor de prueba (`valores-por-confirmar.md` §3). LC: "Confirm email" apagado |
| RF-03 | Navegación según rol | `app/_layout.tsx`, `app/(cliente)/(drawer)/_layout.tsx`, `app/(trabajador)/(drawer)/_layout.tsx`, ambos `(tabs)/_layout.tsx`, `src/config/menus.ts`, `src/config/pestanas.ts` | #8, #10 | Bitácora J2, J3 | Cumplido con la navegación de las decisiones del equipo (CLAUDE.md); el texto de RF-03 se corrige en el Word (`actualizar-informe.md`). LC: `/perfil` y `/cotizaciones` duplicadas |
| RF-04 | Sesión persistente y cierre | `src/store/sesionStore.ts`, `app/index.tsx`, `src/services/api.ts` (renovación del token), `src/hooks/useCerrarSesion.ts` | #5, #8 | Bitácora F3; CP-10 (PR #16) | Cumplido |
| RF-05 | Listado del catálogo | `app/(cliente)/(drawer)/(tabs)/catalogo.tsx`, `src/services/productos.service.ts`, `src/mappers/producto.mapper.ts`, `src/hooks/useProductos.ts`, `src/utils/precios.ts` | #7, #10 | `f4-prueba-productos.txt`; `c1-verificar-seguridad.txt` | Cumplido. Precio por tipo de cliente: valor de prueba |
| RF-06 | Búsqueda de productos | `catalogo.tsx`, `src/utils/catalogo.ts`, `src/utils/texto.ts` | #10 | Bitácora J3 (PR #10) | Cumplido |
| RF-07 | Filtro por categoría y marca | `catalogo.tsx`, `src/components/FilaChips.tsx`, `src/components/ChipFiltro.tsx`, `src/config/filtrosCatalogo.ts` | #10, #20 | Bitácora fix-filtros (iPhone) | Cumplido |
| RF-08 | Detalle de producto | `app/producto/[id].tsx`, `src/hooks/useProductos.ts`, `src/components/ImagenProducto.tsx` | #7, #10 | `f4-prueba-productos.txt` (id inexistente → null) | Cumplido, falta probar "Producto no encontrado" en el teléfono (CP-09) |
| RF-09 | Componentes reutilizables | `src/components/Boton.tsx`, `EstadoVista.tsx`, `TarjetaProducto.tsx`, `src/types/props.types.ts` | #4, #10 | Bitácora J1, J3 | Cumplido |
| RF-10 | Agregar al carrito y cantidades | `src/components/ContadorCantidad.tsx`, `app/producto/[id].tsx`, `src/store/carritoStore.ts` | #10 | CP-07 | Cumplido |
| RF-11 | Carrito compartido | `src/store/carritoStore.ts`, `app/(cliente)/(drawer)/(tabs)/_layout.tsx` (indicador) | #10 | CP-10 (PR #16); prueba de 008 (carrito tras cerrar la app) | Cumplido. LC: carrito con un producto desactivado |
| RF-12 | Cálculo del total | `src/utils/calculos.ts`, `src/hooks/useCalculoTotal.ts`, `src/components/ResumenCarrito.tsx` | #10 | Script de J3 (2 × 79.000 + 1 × 199.000 + instalación = 574.830) | Cumplido. IVA y tarifas: valores de prueba |
| RF-13 | Registro de pedido | `src/components/ConfirmarCompraCarrito.tsx`, `src/services/pedidos.service.ts`, `app/(cliente)/flujos/confirmacion-pedido.tsx`, `supabase/migrations/008_compras_y_citas.sql` | #13, #16, #18 | `f-008-compras-citas.txt`; bitácora 008 (dos dispositivos); `cp01-pedido-confirmado.png` | Cumplido. LC: sin pago real ("Pago simulado") |
| RF-14 | Mis pedidos | `app/(cliente)/(drawer)/mis-pedidos.tsx`, `app/(cliente)/flujos/pedido/[id].tsx`, `src/hooks/usePedidos.ts`, `src/mappers/pedido.mapper.ts` | #16 | Bitácora J6 | Parcial / LC: solo estado Pendiente; el trabajador no abre el detalle de un pedido |
| RF-15 | Solicitud de cotización | `app/(cliente)/flujos/solicitar-cotizacion.tsx`, `src/components/SelectorProductosInteres.tsx`, `src/services/cotizaciones.service.ts`, `supabase/migrations/005_solicitud_cotizacion.sql` | #9, #14 | `f5-prueba-solicitud.txt`; CP-01 paso 1 | Cumplido |
| RF-16 | Elaboración de cotización | `app/(trabajador)/flujos/cotizacion-form.tsx`, `src/components/SelectorProductoCotizacion.tsx`, `src/utils/cotizacionForm.ts`, `supabase/migrations/006_borrador_cotizacion.sql` | #11 | `f6-prueba-borrador.txt`; bitácora F6 | Cumplido. LC: no se reserva inventario |
| RF-17 | Cálculo de la cotización | `src/hooks/useCalculoTotal.ts`, `src/utils/calculos.ts`, `src/components/ResumenCotizacion.tsx` | #11 | CP-08 (cotización) | Cumplido |
| RF-18 | Envío de cotización | `src/services/cotizaciones.service.ts`, `supabase/migrations/006_borrador_cotizacion.sql`, `007_borrador_oculto_cliente.sql` | #11, #14 | `f-borrador-oculto.txt`; CP-01; CP-06 | Cumplido. Vigencia 15 días: valor de prueba |
| RF-19 | Listado de cotizaciones | `app/(trabajador)/(drawer)/(tabs)/cotizaciones.tsx`, `src/components/TarjetaCotizacion.tsx` | #11, #21 | Bitácora F6 | Cumplido |
| RF-20 | Bandeja de entrada | `app/(cliente)/(drawer)/(tabs)/cotizaciones.tsx`, `src/hooks/useRecargarAlVolver.ts`, `src/mappers/cotizacion.mapper.ts` | #13, #14, #16 | CP-01 (iPhone) | Cumplido. LC: sin tiempo real ni notificaciones |
| RF-21 | Detalle de cotización | `app/cotizacion/[id].tsx`, `src/components/TotalesCotizacion.tsx` | #13 | CP-09 (cotización), CP-11 | Cumplido |
| RF-22 | Aceptar o rechazar | `src/components/AccionesCotizacionCliente.tsx`, `src/services/cotizaciones.service.ts`, `supabase/migrations/003_funciones.sql` | #13 | CP-01 (PR #13, #16); CP-06 (rechazo); `cp01-pedido-confirmado.png` | Cumplido |
| RF-23 | Mapa del negocio | `app/(cliente)/flujos/mapa.tsx`, `app/(cliente)/(drawer)/ubicacion-negocio.tsx`, `src/components/MapaLeaflet.tsx`, `assets/mapa/leafletHtml.ts`, `src/config/valoresPrueba.ts` | #12 | CP-02 a CP-05 (revisión del PR #12, iPhone, sin captura) | Cumplido. Coordenadas: valor de prueba |
| RF-24 | Ubicación actual | `src/hooks/useUbicacion.ts`, `src/components/AvisoUbicacion.tsx` | #12 | CP-02, CP-03, CP-04 (revisión del PR #12, iPhone, sin captura) | Cumplido |
| RF-25 | Seguimiento | `src/hooks/useUbicacion.ts`, `src/components/PanelSeguimiento.tsx`, `src/store/mapaStore.ts` | #12 | CP-05 (revisión del PR #12, iPhone, sin captura) | Cumplido |
| RF-26 | Registro de ubicación de servicio | `app/(trabajador)/flujos/ubicacion-form.tsx`, `app/(cliente)/(drawer)/mis-ubicaciones.tsx`, `app/(trabajador)/(drawer)/ubicaciones.tsx`, `src/services/ubicaciones.service.ts`, `src/mappers/ubicacion.mapper.ts` | #12 | Bitácora J4; CP-01 completo (revisión del PR #16); F8 (historial con ubicaciones) | Cumplido |
| RF-27 | Agendar cita | `app/(cliente)/flujos/agendar-cita.tsx`, `src/services/citas.service.ts`, `src/utils/citas.ts`, `supabase/migrations/008_compras_y_citas.sql` | #16, #18 | `f-008-compras-citas.txt`; bitácora 008 (dos dispositivos) | Cumplido. Días, franjas y cupos: valores de prueba |
| RF-28 | Consulta y gestión de citas | `app/(cliente)/(drawer)/mis-citas.tsx`, `app/(trabajador)/(drawer)/(tabs)/citas.tsx`, `src/hooks/useCitas.ts` | #16 | CP-01 completo y CP-06 (revisión del PR #16, cita Realizada y cambio de estado sin conexión); bitácora 008 | Cumplido. LC: sin reprogramar; reglas de prueba |
| RF-29 | Crear producto | `app/(trabajador)/flujos/producto-form.tsx`, `src/services/productos.service.ts`, `src/utils/validaciones.ts` | #17 | CP-08 (revisión del PR #17, iPhone, sin captura) | Cumplido |
| RF-30 | Editar producto | `producto-form.tsx` (envía solo los campos que cambiaron) | #17 | Bitácora J7; revisión del PR #17 | Cumplido |
| RF-31 | Eliminar producto | `src/hooks/useEliminarProducto.ts`, `app/(trabajador)/(drawer)/(tabs)/productos.tsx` | #17 | Bitácora J7 | Parcial / LC: se desactiva y no se reactiva desde la app |
| RF-32 | Carga y depuración del inventario | `scripts/depurar-inventario.mjs`, `supabase/seed/inventario_inicial.sql`, `docs/depuracion-inventario.md` | #15 | `f7-carga-inventario.txt`; ejecutado en Supabase (76 productos) | Parcial / LC: reglas de depuración por confirmar con el cliente |
| RF-33 | Gestión de clientes | `app/(trabajador)/(drawer)/(tabs)/clientes.tsx`, `app/(trabajador)/flujos/cliente-form.tsx`, `app/(trabajador)/flujos/cliente/[id].tsx`, `src/components/HistorialCliente.tsx`, `src/services/clientes.service.ts` | #9, #19, #21 | `f5-prueba-solicitud.txt`; bitácora F8 (historial solo del cliente) | Cumplido |
| RF-34 | Usuarios y roles | `app/(trabajador)/(drawer)/usuarios.tsx`, `app/(trabajador)/flujos/usuario-form.tsx`, `src/services/usuarios.service.ts`, `src/hooks/useUsuarios.ts`, `supabase/functions/admin-usuarios/index.ts` | #19 | Bitácora F8; CP-12 | Cumplido. LC: contraseña temporal sin cambio obligatorio; correo no editable |
| RF-35 | Ventas y ganancias | `app/(trabajador)/(drawer)/(tabs)/panel.tsx`, `src/components/GraficaVentas.tsx`, `src/components/TarjetasResumenPanel.tsx`, `src/services/ventas.service.ts`, `src/hooks/useVentas.ts`, `supabase/migrations/009_costo_ventas.sql` | #19 | `f8-admin.txt`; bitácora F8 (mes sin ventas en cero) | Cumplido. LC: costo de pedidos anteriores a 009; el descuento no se reparte. Umbral de stock bajo: valor de prueba |

## C. Requerimientos no funcionales

| RNF | Categoría | Archivos principales | PR | Evidencia | Estado |
| --- | --- | --- | --- | --- | --- |
| RNF-01 | Usabilidad | `app/_layout.tsx` (`SafeAreaProvider`), formularios con `KeyboardAvoidingView` (`login.tsx`, `registro.tsx`, `solicitar-cotizacion.tsx`, `agendar-cita.tsx`, `carrito.tsx`…) | #1, #4 | — | Parcial: el criterio pide que un usuario complete el proceso sin ayuda → **prueba con el cliente** (`docs/prueba-cliente.md`) |
| RNF-02 | Estados e interfaz | `src/components/EstadoVista.tsx`, `src/components/ImagenProducto.tsx`, `tailwind.config.js`, `assets/fonts/` | #1, #4, #10, #21 | Bitácora C1 (auditoría de pantallas) | Cumplido |
| RNF-03 | Rendimiento | `catalogo.tsx` (FlatList, filtros sobre datos cargados), `src/services/queryClient.ts`, hooks con staleTime/gcTime | #7, #10 | Bitácora F4, J3 | Cumplido. Tiempos objetivo: por confirmar |
| RNF-04 | Compatibilidad | `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, README | #1, #6, #11, #21 | expo-doctor 20/20; pruebas en teléfonos reales con Expo Go | Cumplido |
| RNF-05 | Control de acceso | `src/components/RutaProtegida.tsx`, `src/hooks/useRequiereRol.ts`, `supabase/migrations/002_seguridad.sql`, `004_ajustes_seguridad.sql`, `supabase/functions/admin-usuarios/index.ts` | #3, #8, #19 | CP-12; `c1-verificar-seguridad.txt`; `f2-05`, `f2-07`, `f2-08` | Cumplido. LC: token válido hasta 1 h tras desactivar |
| RNF-06 | Confidencialidad del costo | `002_seguridad.sql` (`productos_catalogo`), `007_borrador_oculto_cliente.sql`, `009_costo_ventas.sql`, `src/models/Producto.ts`, `src/mappers/producto.mapper.ts` | #3, #7, #14, #19 | CP-11; `c1-verificar-seguridad.txt`; `f2-02`, `f2-03`, `f2-06` | Cumplido |
| RNF-07 | Credenciales | `.env.template`, `.gitignore`, `.github/workflows/ci.yml`, `scripts/verificar-seguridad.mjs` | #1, #6, #21 | CI; revisión del historial (bitácora C1) | Cumplido |
| RNF-08 | Sin conexión | `src/services/api.ts`, `src/hooks/useEnLinea.ts`, `src/components/AvisoConexion.tsx`, `src/components/AvisoErrorAccion.tsx`, `008_compras_y_citas.sql` | #5, #11, #13, #16, #18, #21 | CP-06 | Cumplido. LC: requiere conexión para guardar |
| RNF-09 | Persistencia | `src/store/sesionStore.ts`, `src/store/carritoStore.ts`, Supabase | #3, #5, #10 | CP-10 (revisión del PR #16, iPhone, sin captura); prueba de 008 (cierre a mitad de compra) | Cumplido |
| RNF-10 | Datos compartidos | `src/services/`, `supabase/migrations/` | #3 | CP-01 con dos dispositivos (PR #13, #16) | Cumplido. LC: pausa del plan gratuito |
| RNF-11 | Organización del código | `app/`, `src/`, `src/services/api.ts` | #1, #8 | Árbol de `actualizar-informe.md`; `cambios-estructura.md` | Cumplido |
| RNF-12 | Tipado | `src/types/`, `src/models/`, `tsconfig.json` (strict) | Todos | Typecheck en CI y en cada prompt | Cumplido |
| RNF-13 | Privacidad de la ubicación | `src/hooks/useUbicacion.ts` (permiso solo al usar), `002_seguridad.sql` (RLS de `ubicaciones`) | #3, #12 | CP-02 (revisión del PR #12, iPhone, sin captura) | Cumplido. Conservación de ubicaciones: por confirmar |
| RNF-14 | Liberación de suscripciones | `src/hooks/useUbicacion.ts`, `src/hooks/useRecargarAlVolver.ts` | #12, #13 | CP-05 (revisión del PR #12, iPhone, sin captura); bitácora C1 (todos los efectos con limpieza) | Cumplido |
| RNF-15 | Integridad del inventario | `001_esquema.sql` (checks e índice único del código), `003_funciones.sql` (bloqueo), `008_compras_y_citas.sql`, `inventario_inicial.sql`, `producto-form.tsx` | #3, #15, #17, #18 | `f7-carga-inventario.txt`; `f-008-compras-citas.txt` (caso 9, llamadas simultáneas); `f2-10-cp07-inventario-insuficiente.png` | Cumplido. LC: ejecutar dos veces la carga del inventario |

## Resumen de pendientes de la matriz

- **Único caso pendiente de probar en el teléfono:** "Producto no encontrado" de CP-09 (RF-08).
  Está comprobado en el servicio (`f4-prueba-productos.txt`) y "Cotización no encontrada" sí se
  probó en el teléfono.
- Varias pruebas se comprobaron **a la vista en iPhone con Expo Go, sin captura**, en la revisión
  del PR: CP-02 a CP-05 (PR #12), CP-07 escribiendo a mano (PR #10), CP-01 completo, CP-06 y
  CP-10 (PR #16) y CP-08 en el formulario de producto (PR #17). Detalle en `docs/pruebas.md`.
- **Parciales o límite conocido**: RF-14, RF-31 y RF-32, más RNF-01, que depende de la prueba con
  el cliente.
- Todos los valores de prueba siguen **por confirmar con el cliente**
  (`docs/valores-por-confirmar.md`).
