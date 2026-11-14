# Sustentación final

Prompt C2 (cierre). Guion de la demostración en vivo con dos teléfonos y lo que explica cada
integrante. Los lineamientos (sección 8) piden: demostración del proceso completo y que **cada
integrante** explique navegación, estado, hook propio, peticiones, mapper, cálculos y permisos; la
profesora puede pedir un cambio breve sobre el código.

Los pasos detallados de cada caso están en `docs/pruebas.md`.

## 1. Preparación del día anterior

- [ ] **Supabase activo.** Entrar al panel; si dice *Paused*, pulsar **Restore project** y esperar
      a que termine (puede tardar varios minutos). Abrir el catálogo en la app para comprobarlo.
- [ ] Repetir la comprobación **la mañana de la sustentación** (el plan gratuito se pausa tras una
      semana sin uso).
- [ ] Función `admin-usuarios` publicada y migraciones 001 a 009 aplicadas
      (`docs/servicio-remoto.md`).
- [ ] **Expo Go actualizado** en los dos teléfonos y compatible con SDK 58.
- [ ] Computador con Node.js compatible (README), `npm install` hecho, `.env` presente y
      `npx expo start` probado en la red donde se hará la sustentación (si la red de la
      universidad bloquea, usar `npx expo start --tunnel`).
- [ ] `npm run typecheck` sin errores en la rama que se va a mostrar (`main`).
- [ ] **Datos de prueba listos:**
  - [ ] Las tres cuentas (`cliente@cse.test`, `trabajador@cse.test`, `admin@cse.test`) activas y
        con su rol.
  - [ ] DVR `DS-7204HGHI-M1(C)` con **inventario 2** (revisar en Productos; ajustar si una compra
        de prueba lo bajó).
  - [ ] El cliente tiene al menos una ubicación registrada (por si el mapa falla en la sala).
  - [ ] Una cotización ya enviada (Nueva) de respaldo, por si el envío en vivo falla.
  - [ ] Carrito del cliente vacío al empezar.
- [ ] **Contraseñas a mano**, en papel o en el gestor de contraseñas de cada integrante. **No** se
      escriben en este documento ni en el repositorio.
- [ ] Permiso de ubicación de Expo Go **borrado** en el teléfono del cliente (para mostrar CP-02).
- [ ] Teléfonos cargados, brillo alto, notificaciones en silencio.
- [ ] Editor abierto con los archivos de la sección 4 en pestañas.
- [ ] Copia de `docs/evidencias/` a mano por si falla la red (capturas y salidas de los scripts).

## 2. Guion de la demostración (≈ 20 min)

Teléfono A = cliente (`cliente@cse.test`). Teléfono B = trabajador (`trabajador@cse.test`).
Quién habla en cada parte está entre corchetes.

### 2.1 Presentación (1 min) [Felipe]

Cliente y problema: el negocio vende e instala cámaras y hoy lleva el inventario en Excel y cotiza
por mensajes. La app comparte el inventario entre teléfonos, deja cotizar, comprar y agendar.

### 2.2 Proceso principal, CP-01 (8 min)

| Paso | Teléfono | Quién explica | Qué mostrar | Tema del curso |
| --- | --- | --- | --- | --- |
| 1 | A | Juan Pablo | Inicio de sesión; abre Inicio del cliente. Mostrar Tabs y Drawer | Navegación (Stack, Tabs, Drawer), formulario |
| 2 | A | Felipe | Solicitar cotización (Instalación, descripción, productos de interés). Queda "Por cotizar" | Formulario, Axios (RPC), TanStack Query (mutación) |
| 3 | B | Felipe | Cotizaciones > Solicitada > Crear cotización. Dos productos, contador, descuento; el total cambia | Contador, cálculo, hook `useCalculoTotal` |
| 4 | B | Felipe | Guardar borrador; en A sigue "Por cotizar" sin precios. Enviar al cliente | Seguridad en el servidor (007) |
| 5 | A | Juan Pablo | Deslizar la bandeja: Nueva con punto azul. Abrir: pasa a Vista; mismo total | Ruta dinámica `/cotizacion/[id]`, mapper, useEffect |
| 6 | A | Juan Pablo | Aceptar y comprar → ¡Pedido confirmado!, "Pago simulado", número de pedido | Axios, confirmación solo con respuesta del servidor |
| 7 | A | Juan Pablo | Agendar cita → registrar ubicación en el mapa (aquí aparece el permiso) | Mapa, permisos (sección 2.3) |
| 8 | A | Juan Pablo | Fecha, franja, ubicación → Programada en Mis citas | Formulario, conservación |
| 9 | B | Juan Pablo | Citas: aparece Programada; Cotizaciones: Aceptada | Datos compartidos entre dispositivos (RNF-10) |

### 2.3 Permisos del mapa, CP-02 a CP-05 (4 min) [Juan Pablo]

En el teléfono A, con el permiso borrado:

1. Mostrar que la app **no** pidió el permiso al abrir (RNF-13).
2. Ubicación del negocio > **Mi ubicación** > **No permitir**: mensaje y **Abrir ajustes**.
3. Abrir ajustes, conceder, volver: centra sin reiniciar (listener de `AppState`).
4. Apagar el GPS > **Mi ubicación**: "Active la ubicación del dispositivo", no queda cargando.
5. Encender el GPS > **Activar seguimiento**, **Pausar**, **Reanudar**, salir: el indicador de
   ubicación del sistema desaparece (limpieza de la suscripción).

> Estos casos se aprobaron a la vista en iPhone en la revisión del PR #12, sin captura
> (`docs/pruebas.md`). Ensayarlos antes de la sustentación.

### 2.4 Casos que más pueden pedir (5 min)

| Caso | Teléfono | Quién | Qué mostrar |
| --- | --- | --- | --- |
| CP-07 | A | Juan Pablo | DVR `DS-7204HGHI-M1(C)`: + tres veces → se detiene en 2 con "Solo hay 2 unidades disponibles"; escribir 5 → rechazado |
| CP-08 | B | Juan Pablo (producto) y Felipe (cotización) | Producto: nombre vacío y "abc" en el precio → mensaje por campo. Cotización: descuento vacío o "20.000" → "Ingrese un valor numérico" |
| CP-12 | A | Felipe | Escribir la ruta `/usuarios` (y `/panel`) como cliente → "Acceso no autorizado". Explicar que además el servidor rechaza (RLS) |
| CP-06 (si hay tiempo) | A | Felipe | Modo avión → Confirmar pedido: aviso sin confirmación; quitar modo avión → Reintentar crea un solo pedido |
| CP-11 (si preguntan por el costo) | Computador | Felipe | `docs/evidencias/c1-verificar-seguridad.txt` o correr `npm run verificar-seguridad` |

### 2.5 Administrador (2 min) [Felipe]

Con `admin@cse.test`: Panel general (mes actual, tarjetas, gráfica), Usuarios y roles (crear,
cambiar rol, desactivar).

## 3. Qué explica cada integrante

### Juan Pablo — J1 a J7

| Prompt | Qué hizo | Debe poder explicar |
| --- | --- | --- |
| J1 | Login, Registro, componentes Boton, EstadoVista y CampoTexto, validaciones | Props tipadas, useState en formularios, validación por campo |
| J2 | Stack, Tabs y Drawer por rol, RutaProtegida y "Acceso no autorizado" | Navegación y protección de rutas |
| J3 | Catálogo con búsqueda y filtros, detalle `/producto/[id]`, carrito con Zustand, contador, `useCalculoTotal` | useState, Zustand con persist, contador, cálculo, hook propio |
| J4 | Mapa con Leaflet en WebView, `useUbicacion`, ubicaciones de servicio | Hook propio, useEffect con limpieza, permisos, mapaStore |
| J5 | Bandeja, `/cotizacion/[id]`, aceptar y rechazar, confirmación de pedido | Ruta dinámica, TanStack Query (consulta y mutación), useEffect |
| J6 | Confirmar compra, Mis pedidos, Detalle de pedido, Agendar cita, citas, Inicio del cliente | Formularios, mutaciones, sin conexión con Reintentar |
| J7 | Productos del trabajador y formulario de producto | Formulario con validaciones, mutaciones que invalidan la caché |

### Felipe — F1 a F8, migraciones 007 a 009, C1 y C2

| Prompt | Qué hizo | Debe poder explicar |
| --- | --- | --- |
| F1 | Proyecto Expo SDK 58, NativeWind, fuentes, layout raíz con QueryClient | Estructura, NativeWind, fuente personalizada, áreas seguras |
| F2 | Esquema, RLS, vista sin costo y funciones en Supabase | Seguridad en el servidor, por qué la anon key no es secreta |
| F3 | `api.ts` con interceptores, `auth.service`, `sesionStore` | Axios con interceptores, renovación del token, Zustand con persist |
| F4 | Tipos, modelos, mappers y `useProductos` | Interfaces de respuesta, mapper, TanStack Query (queryKey, staleTime, gcTime) |
| F5 | Clientes y solicitud de cotización (RPC 005) | Formularios, búsqueda, RPC transaccional |
| F6 | Cotizaciones del trabajador y Crear cotización (RPC 006) | Contador, cálculo con `useCalculoTotal`, sin conexión |
| F7 | Depuración del Excel y carga del inventario | Reglas de RF-32, integridad (RNF-15) |
| F8 | Usuarios y roles (Edge Function), Panel general (009), historial del cliente | Seguridad en el servidor, cálculo de ganancias |
| 007 | El cliente no ve la cotización en preparación | Vista con `security_invoker` sobre función SECURITY DEFINER |
| 008 | Compra sin duplicados (`compraId`) y citas sin repetir | Idempotencia, bloqueo con nombre, hora de Colombia |
| 009 | Costo guardado al vender | Por qué la ganancia no cambia si cambia el costo |
| C1 | Auditoría técnica, README, límites y valores por confirmar | Cómo se revisó estados de carga, sin conexión y secretos |
| C2 | Pruebas, matriz, guion de cliente, sustentación y entrega | Estado de cada caso de prueba |

## 4. Temas del curso: dónde están

Cada integrante debe poder abrir el archivo y explicar **entradas, estado, efectos y resultado**.

### Juan Pablo

| Tema | Archivo | Qué decir |
| --- | --- | --- |
| Props tipadas | `src/types/props.types.ts` (`BotonProps`, `EstadoVistaProps`, `CampoTextoProps`), `src/components/Boton.tsx`, `src/components/EstadoVista.tsx` | Las props se declaran en un archivo; el mismo componente cambia con su variante, mensaje o acción de Reintentar. EstadoVista se usa en todas las pantallas con datos remotos |
| useState | `app/(auth)/login.tsx:27` (formulario, errores, enviando), `app/(cliente)/(drawer)/(tabs)/catalogo.tsx:41` (búsqueda, categoría, marca) | Cada cambio de estado vuelve a dibujar; `enviando` bloquea el doble envío |
| useEffect | `app/cotizacion/[id].tsx` (marca la cotización como vista una sola vez), `src/hooks/useUbicacion.ts:259` (listener de AppState que devuelve `escucha.remove()`) | Efecto con dependencias y función de limpieza |
| Hook propio `useCalculoTotal` | `src/hooks/useCalculoTotal.ts:72` (JSDoc en la línea 50), `src/utils/calculos.ts` | Entradas: líneas, servicio, textos de descuento y servicio. Estado: los parámetros de TanStack Query. Efectos: ninguno propio (useMemo). Resultado: desglose o errores por campo. Lo usan Carrito y Crear cotización con la misma fórmula del servidor |
| Hook propio `useUbicacion` | `src/hooks/useUbicacion.ts:116` (JSDoc antes) | Pide el permiso solo al pulsar (línea 154), `watchPositionAsync` (línea 199), libera la suscripción al pausar, al salir (`useFocusEffect`, línea 245), en segundo plano y al desmontar |
| Zustand | `src/store/carritoStore.ts:48` (con `persist`), `src/store/mapaStore.ts:29` (sin persistir) | El carrito se comparte entre Catálogo, Detalle y Carrito y sobrevive al cierre; el mapa no se guarda. Los datos del servidor no van en un store |
| Contador | `src/components/ContadorCantidad.tsx` | Límite = inventario; "Solo hay N unidades disponibles"; cantidad escrita validada |
| Navegación | `app/_layout.tsx` (Stack), `app/(cliente)/(drawer)/_layout.tsx` (Drawer), `app/(cliente)/(drawer)/(tabs)/_layout.tsx` (Tabs), `docs/cambios-estructura.md` | Por qué el Drawer está en `(drawer)/` y los flujos en el Stack raíz |
| Ruta dinámica | `app/producto/[id].tsx`, `app/cotizacion/[id].tsx` | `useLocalSearchParams`, "no encontrado" con botón para volver |
| Permisos y protección | `src/components/RutaProtegida.tsx`, `src/hooks/useRequiereRol.ts:18` | Sin sesión → login; otro rol → "Acceso no autorizado" |
| Mapa | `src/components/MapaLeaflet.tsx`, `assets/mapa/leafletHtml.ts` | Leaflet 1.9.4 en WebView; la app manda órdenes con `injectJavaScript` y recibe el punto tocado con `onMessage`; coordenadas validadas como números |
| TanStack Query en pantallas | `app/(cliente)/(drawer)/(tabs)/cotizaciones.tsx`, `src/hooks/useRecargarAlVolver.ts` | Carga, error con Reintentar, vacío, deslizar para recargar |
| Mappers propios | `src/mappers/pedido.mapper.ts`, `src/mappers/cita.mapper.ts`, `src/mappers/ubicacion.mapper.ts` | El de ubicaciones descarta coordenadas inválidas |

### Felipe

| Tema | Archivo | Qué decir |
| --- | --- | --- |
| Axios con interceptores | `src/services/api.ts` (instancia única; interceptor de petición en la línea 50 y de respuesta en la 90) | baseURL y apikey del `.env`; la petición agrega el Bearer; la respuesta convierte todo error en `ErrorApi` (`sin_conexion`, `no_autorizado`, `sesion_expirada`…), renueva el token una vez ante 401 y traduce los mensajes a tú |
| Zustand con persist | `src/store/sesionStore.ts:33` | Token, refresh token y usuario en AsyncStorage; `hidratado` para que `app/index.tsx` espere; al cerrar sesión limpia la caché |
| Mapper | `src/mappers/producto.mapper.ts:53` (`mapearProductoCatalogo`) y `:62` (`mapearProductoPersonal`), `src/mappers/cotizacion.mapper.ts:89` | Respuesta (`src/types/api.types.ts`) → modelo (`src/models/`); el modelo del cliente no tiene costo; "Nueva o Vista vencida = Vencida" |
| TanStack Query | `src/services/queryClient.ts`, `src/hooks/useProductos.ts:50` (queryKey `['productos', rol]`, staleTime 5 min), `src/hooks/useCotizaciones.ts:63` (staleTime 30 s), mutaciones que invalidan (`useAceptarCotizacion`, línea 155) | queryKey por recurso, criterio de caché, `networkMode 'always'` para que sin conexión falle y muestre Reintentar |
| useState y useEffect | `app/(trabajador)/flujos/cotizacion-form.tsx` | Estado del formulario y efecto que precarga la solicitud o el borrador |
| Hook propio `useCalculoTotal` (ampliación de F6) | `src/hooks/useCalculoTotal.ts` | Acepta el costo de servicio escrito y devuelve el error de cada campo; el carrito no cambió |
| Cálculo | `src/utils/calculos.ts:120` (`calcularTotal`) y `supabase/migrations/003_funciones.sql` | Misma fórmula en app y servidor; al enviar se compara el total del servidor con el de la pantalla |
| Seguridad en el servidor | `supabase/migrations/002_seguridad.sql` (RLS, `rol_actual()`, vista `productos_catalogo`), `007_borrador_oculto_cliente.sql`, `008_compras_y_citas.sql`, `009_costo_ventas.sql`, `supabase/functions/admin-usuarios/index.ts` | La anon key es pública; lo que protege son las políticas. Evidencia: `docs/evidencias/c1-verificar-seguridad.txt` |
| Sin conexión | `src/services/api.ts`, `src/components/AvisoConexion.tsx`, `src/store/carritoStore.ts` (`compraId`) | Nunca se confirma sin respuesta del servidor; Reintentar es seguro por el identificador de compra |
| Credenciales | `.env.template`, `.github/workflows/ci.yml`, `scripts/verificar-seguridad.mjs` | Nada secreto en `EXPO_PUBLIC_`; la llave secreta solo vive en los secretos de Supabase |

## 5. Cambios en vivo probables

Ensayar cada uno antes; todos tocan un solo archivo.

| Pedido posible | Dónde | Quién |
| --- | --- | --- |
| Cambiar el texto o la variante de un botón | `src/components/Boton.tsx` o la pantalla que lo usa | Juan Pablo |
| Agregar una categoría o marca a los filtros | `src/config/filtrosCatalogo.ts` | Juan Pablo |
| Cambiar el máximo del contador o su mensaje | `src/components/ContadorCantidad.tsx` | Juan Pablo |
| Cambiar las franjas de citas o el umbral de stock bajo | `src/config/valoresPrueba.ts` | Juan Pablo / Felipe |
| Cambiar el staleTime de una consulta | `src/hooks/useProductos.ts` o `useCotizaciones.ts` | Felipe |
| Agregar un campo al modelo y al mapper | `src/types/api.types.ts`, `src/models/`, `src/mappers/` | Felipe |
| Cambiar el tiempo límite de Axios o un mensaje de error | `src/services/api.ts` | Felipe |
| Cambiar el IVA o una tarifa sin publicar la app | Supabase > Table Editor > `parametros_negocio` | Felipe |

Después de cualquier cambio: `npm run typecheck` y recargar en Expo Go.

## 6. Plan B

- **Supabase no responde:** mostrar que la app informa el error con Reintentar (eso también es un
  requisito) y apoyarse en `docs/evidencias/` y `docs/pruebas.md`.
- **Red de la sala bloquea Expo:** `npx expo start --tunnel`.
- **El mapa no carga:** se ve EstadoVista con Reintentar; el resto de la app sigue (RF-23).
- **Un teléfono falla:** hacer CP-01 con las dos cuentas en un solo teléfono, cerrando sesión entre
  pasos (pierde la demostración de dos dispositivos; avisarlo).
