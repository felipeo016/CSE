# CLAUDE.md — App Centro de Seguridad Electrónica (Móvil II)

Proyecto final de Desarrollo Móvil II. Equipo: Felipe Obregón Castro y Juan Pablo Murillo Villalobos.
Cada prompt dice quién es el responsable. La profesora revisa avances por hito y cada integrante debe
ejecutar y explicar lo que desarrolló, y puede pedir un cambio en vivo sobre el código.

## Fuentes de verdad

Para la entrega, la documentación, los lineamientos, el mockup, la referencia de clase y el Excel se
sacaron del repositorio y se archivan aparte (carpeta `CSE-archivo`, junto al proyecto, con las
carpetas docs, mockup, referencia-clase y datos). Si un prompt los necesita, pídelos.

- Documentación del proyecto (docs/documentacion-proyecto.md en el archivo): requerimientos (RF/RNF),
  reglas de negocio (sección 5), mapa de pantallas (sección 6), organización del código (sección 7),
  matriz (8), conservación (9), pruebas (10). Se sigue al pie de la letra.
- Lineamientos de la profesora (docs/lineamientos-profesora.md en el archivo): requisitos académicos
  obligatorios.
- Mockup (carpeta mockup en el archivo): diseño visual. Copia distribución, colores, tipografía,
  íconos y textos visibles.
- Referencia de clase (carpeta referencia-clase en el archivo): proyecto base y trabajos de clase. No se
  compila ni se modifica. Úsalos como guía de estilo y convenciones (nombres, forma de servicios,
  hooks, stores y tipos) y como base del mapa con
  WebView, Leaflet, Zustand y expo-location. Se toma su enfoque, no sus versiones ni su estructura: la
  estructura de carpetas la manda la sección 7 de la documentación y la versión de Expo es SDK 58. Si un
  trabajo difiere, se sigue el proyecto.

Prioridad ante conflicto:
1. En funcionalidad: lineamientos > documentación > mockup.
2. En lo visual: mockup.
3. Si un conflicto no se resuelve con esta regla, o algo no está definido en ninguna fuente ni en este
   archivo, DETENTE Y PREGUNTA. No inventes reglas de negocio.

## Stack obligatorio

- React Native + TypeScript (strict) + Expo SDK 58, con Expo Router. Las versiones son las de
  `package.json` (SDK 58), aunque los trabajos de la referencia de clase usen otra.
- NativeWind para estilos; al menos una fuente personalizada (expo-font); react-native-safe-area-context.
- Zustand para estado compartido entre pantallas; persist con AsyncStorage solo para sesión y carrito.
- TanStack Query para estado remoto (queryKey por recurso, staleTime/gcTime definidos).
- Axios para TODO acceso HTTP, con una sola instancia en `src/services/api.ts`.
- Servicio remoto: Supabase (REST de PostgREST, Auth, RPC y Edge Functions) consumido solo por HTTP con
  Axios. NO instalar `@supabase/supabase-js`: Axios es lo que se evalúa.
- Mapa: OpenStreetMap + Leaflet dentro de react-native-webview; ubicación con expo-location (solo primer plano).
- También permitidas: @react-native-community/netinfo, @react-native-community/datetimepicker,
  expo-splash-screen, @expo/vector-icons (set Feather), react-native-gesture-handler (lo exige el
  Drawer), expo-crypto (identificador único de cada compra). Cualquier otra librería: pregunta antes.

## Estructura

La de la sección 7 de la documentación, más `src/config/`. `app/` solo contiene rutas y pantallas;
la lógica va en `src/` (components, hooks, services, types, models, mappers, store, utils, config).
Si Expo Router o una pantalla obliga a cambiar la estructura, haz el cambio mínimo y anótalo en
el registro de cambios de estructura (docs/cambios-estructura.md, archivado fuera del repositorio).

## Reglas de código

- Sin `any`. Respuestas del servicio en `src/types/api.types.ts`; props en `src/types/props.types.ts`;
  entidades internas en `src/models/`; los mappers convierten respuesta → modelo.
- El cliente nunca recibe ni ve costo ni ganancia: lo impide la base de datos (vista sin costo) y el
  modelo del cliente no tiene esos campos (RNF-06).
- `baseURL` = `EXPO_PUBLIC_SUPABASE_URL`; header `apikey` = `EXPO_PUBLIC_SUPABASE_ANON_KEY`. La anon key
  es pública por diseño y la seguridad la dan las políticas RLS. Nunca la llave service_role en la app.
- Toda pantalla con datos remotos muestra carga, error con Reintentar y vacío (componente EstadoVista).
- Nunca confirmes un envío o registro sin respuesta exitosa del servidor. Sin conexión: se informa y no
  se crea nada; Reintentar completa la acción cuando vuelve la conexión (RNF-08).
- Los efectos que abren suscripciones (ubicación, AppState, listeners) siempre devuelven limpieza.
- Mapa: Leaflet en versión fija 1.9.4; las coordenadas que recibe el mapa se validan como números antes
  de usarlas.
- Zustand guarda solo estado local compartido (sesión, carrito, mapa). Los datos del servidor se piden y
  se guardan con TanStack Query, nunca dentro de un store.
- El permiso de ubicación se pide solo al usar el mapa, nunca al abrir la app (RNF-13).
- Formularios: mensaje específico por campo, no quedan tapados por el teclado, botón con estado de carga
  y sin doble envío. Respeta las áreas seguras.
- Textos de la UI en español. Usa exactamente los textos que cita la documentación, por ejemplo:
  "Solo hay N unidades disponibles", "Agotado", "Producto no encontrado", "Cotización no encontrada",
  "Ingrese un valor numérico", "Active la ubicación del dispositivo", "Acceso no autorizado",
  "Pago simulado".
- Los textos de la app tratan al usuario de tú, como el mockup; los textos que la documentación cita literalmente se usan tal cual.
- Código simple y legible para estudiantes, con comentarios breves en español donde la lógica no sea
  obvia. Mejor claro que ingenioso.
- Alcance: haz solo lo que pide el prompt actual. Si necesitas algo de otro prompt que aún no existe,
  dilo en lugar de hacerlo.
- Una pantalla que pertenece a un prompt futuro muestra su título y EstadoVista
  "En construcción — [ID del prompt]". Nunca botones sin acción, rutas rotas ni pantallas de muestra sin
  marcar. En C1 no debe quedar ningún "En construcción".

## Decisiones del equipo

Navegación (la documentación se contradice entre RF-03 y las secciones 6 y 7; manda esto):
- Cliente, pestañas: Inicio, Catálogo, Cotizaciones (bandeja), Carrito.
- Cliente, Drawer: Mis pedidos, Mis citas, Mis ubicaciones, Ubicación del negocio, Perfil, Cerrar sesión.
- Trabajador, pestañas: Productos, Cotizaciones, Clientes, Citas.
- Trabajador, Drawer: Ubicaciones, Perfil, Cerrar sesión.
- Administrador: todo lo del trabajador + pestaña Panel general + opción Usuarios y roles en el Drawer.
- Stack para los flujos (producto/[id], cotizacion/[id], solicitar cotización, crear cotización, mapa,
  agendar cita, confirmación de pedido, formularios). El mapa es una ruta compartida por cliente y trabajador.
- Se agrega detalle de pedido (Mis pedidos lo exige) y se anotó en el registro de cambios de estructura (archivado fuera del repositorio).

Valores de prueba ([Por confirmar con el cliente], sección 12). Cada uno se marca en código con
`// VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-xx)`.
- En la tabla `parametros_negocio` de Supabase (la app y el servidor calculan con los mismos):
  IVA 19 % sobre (subtotal − descuento); tarifa instalación 150000 COP; tarifa mantenimiento 80000 COP;
  vigencia de cotización 15 días.
- En `src/config/valoresPrueba.ts`: días de atención lunes a sábado; franjas 08:00–10:00, 10:00–12:00,
  14:00–16:00, 16:00–18:00; sin límite de cupos; COORDENADAS_NEGOCIO (las escribe el equipo).
- Precios: cada cliente tiene tipo instalador o final (por defecto final) y ve y paga el precio de su
  tipo. Trabajador y administrador ven ambos precios y el costo. El cliente nunca ve costo.
- Descuento: 0 en el carrito; en la cotización lo ingresa el trabajador en pesos.
- No se reserva inventario durante la cotización; se verifica al aceptar y al confirmar compra.
- Cotización enviada no se edita. Nueva o Vista con vigencia vencida = Vencida.
- Autorregistro de clientes permitido.
- Pedido: solo estado Pendiente en esta versión (límite documentado).
- Eliminar producto = desactivarlo. Producto sin código: se permite con advertencia.
- Citas: solo el trabajador cambia el estado (Programada → Realizada o Cancelada).
- Sesión: si el token vence se intenta renovar una vez; si falla, se pide iniciar sesión de nuevo.
- Excel (RF-32): duplicados → fila de la hoja más reciente; sin código → SIN-COD-001…; negativo → 0 y
  se reporta.

## Qué prompt completa cada pantalla

| Pantalla | Prompt |
| --- | --- |
| Inicio de la app, Iniciar sesión, Registro | J1 (conexión real en F3) |
| Perfil | F3 |
| Drawers, pestañas, Acceso no autorizado | J2 |
| Catálogo, Detalle de producto, Carrito | J3 (confirmar compra en J6) |
| Solicitar cotización, Clientes, Formulario de cliente | F5 |
| Detalle de cliente | F5 (datos) y F8 (historial) |
| Cotizaciones del trabajador, Crear cotización | F6 |
| Mapa, Ubicación del negocio, Mis ubicaciones, Ubicaciones, Registrar ubicación | J4 |
| Bandeja (Cotizaciones del cliente), Detalle de cotización, Confirmación de pedido | J5 |
| Inicio del cliente, Mis pedidos, Detalle de pedido, Agendar cita, Mis citas, Citas del trabajador | J6 |
| Productos del trabajador, Formulario de producto | J7 |
| Panel general, Usuarios y roles | F8 |

## Al terminar cada prompt

1. `npm run typecheck` sin errores y la app arranca con `npx expo start` sin errores.
2. Agrega una fila en la bitácora (docs/bitacora.md, archivada fuera del repositorio): fecha de hoy, objetivo (hito), tarea realizada, responsable
   (el del prompt), evidencia "rama/commit: [pendiente]", dificultad encontrada, observación del docente
   vacía y siguiente paso.
3. Responde con:
   - Archivos creados y modificados.
   - Cómo probarlo en un Android con Expo Go, paso a paso.
   - Qué RF/RNF y qué requisito de los lineamientos cubre.
   - Una explicación sencilla para sustentar: qué hace cada parte y qué temas del curso usa (props,
     useState/useEffect, hook propio, Zustand, Axios, mapper, TanStack Query, permisos…).
   - Lo que quedó pendiente o necesita decisión del equipo.
