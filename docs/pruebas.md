# Casos de prueba CP-01 a CP-12

Prompt C2 (cierre). Casos de la sección 10 de `docs/documentacion-proyecto.md`, con los pasos
exactos para un teléfono real con Expo Go, el resultado esperado, el resultado obtenido y la
evidencia. El resultado obtenido sale de lo que consta en `docs/bitacora.md`, `docs/evidencias/`
y las revisiones de los PR. Varias pruebas se **comprobaron a la vista en iPhone con Expo Go, sin
captura**, durante la revisión del PR; en ese caso se cita el PR. Cuando no hay registro, el caso
dice **Pendiente de probar**.

Todas las pruebas se hacen en un **teléfono real con Expo Go** (decisión del equipo, ver
`docs/actualizar-informe.md`).

## Antes de empezar

- Supabase activo (no pausado) y con las migraciones 001 a 009, la función `admin-usuarios` y la
  carga del inventario (`docs/servicio-remoto.md`).
- `npx expo start` en el computador y Expo Go en cada teléfono (escanea el QR).
- Cuentas de prueba: `cliente@cse.test`, `trabajador@cse.test` y `admin@cse.test`. Las
  contraseñas las tiene el equipo; no se escriben en este documento.
- Para escribir una ruta a mano (CP-09 y CP-12): en la terminal de `npx expo start` aparece la
  dirección `exp://<IP>:8081`. En el navegador del teléfono abre `exp://<IP>:8081/--/<ruta>`
  (por ejemplo `exp://192.168.1.10:8081/--/usuarios`) y acepta abrirla en Expo Go.
- Las capturas o videos nuevos se guardan en `docs/evidencias/` con el nombre `cpNN-…`.

## Resumen

| Caso | Estado | Fuente |
| --- | --- | --- |
| CP-01 Proceso principal completo | **Aprobado** con dos dispositivos | Revisión de J5 y 007 (PR #13, #14; `cp01-pedido-confirmado.png`) y revisión de J6 (PR #16, a la vista en iPhone, sin captura) |
| CP-02 Permiso denegado | **Aprobado** (a la vista en iPhone, sin captura) | Revisión de J4, PR #12, después de "J4: ajustes de revisión para iOS" |
| CP-03 Regreso desde Ajustes | **Aprobado** (a la vista en iPhone, sin captura) | Ídem |
| CP-04 GPS desactivado | **Aprobado** (a la vista en iPhone, sin captura) | Ídem |
| CP-05 Seguimiento y liberación | **Aprobado** (a la vista en iPhone, sin captura) | Ídem |
| CP-06 Sin conexión | **Aprobado** (todas las acciones) | Bitácora F6 y J5; revisión de J6 (PR #16); bitácora 008 (PR #18) |
| CP-07 Cantidad mayor al inventario | **Aprobado** en servidor y app, incluido escribir 5 a mano | Revisión de J3 (PR #10, a la vista en iPhone, sin captura); bitácora F7; `f2-10-cp07-inventario-insuficiente.png`; `f7-carga-inventario.txt` (D11) |
| CP-08 Campos vacíos o no numéricos | **Aprobado** (cotización y formulario de producto) | Bitácora F6 (PR #11); revisión de J7 (PR #17, a la vista en iPhone, sin captura) |
| CP-09 Identificador inexistente | **Parcial**: aprobado "Cotización no encontrada"; **"Producto no encontrado" pendiente de probar en el teléfono** (solo comprobado en el servicio) | Bitácora J5; `f4-prueba-productos.txt` |
| CP-10 Datos conservados | **Aprobado** (a la vista en iPhone, sin captura) | Revisión de J6, PR #16 |
| CP-11 Cliente sin acceso a costos | **Aprobado** | `c1-verificar-seguridad.txt`; bitácora J5; capturas `f2-02`, `f2-03`, `f2-06` |
| CP-12 Acceso por rol | **Aprobado** | Bitácora F8 (2026-11-13) |

---

## CP-01 — Proceso principal completo

**Dispositivos:** dos. Teléfono A con `cliente@cse.test`, teléfono B con `trabajador@cse.test`.

**Pasos**

1. A: inicia sesión. Pestaña **Cotizaciones** > **Solicitar cotización**. Elige **Instalación**,
   escribe la necesidad (por ejemplo "Cuatro cámaras para el local"), agrega uno o dos productos
   de interés y envía. La solicitud aparece en la bandeja como **Por cotizar**.
2. B: inicia sesión. Pestaña **Cotizaciones**, desliza para recargar. La solicitud aparece como
   **Solicitada**. Pulsa **Crear cotización**.
3. B: comprueba que cliente, tipo de servicio y productos de interés vienen precargados. Deja dos
   productos, ajusta cantidades con + y −, escribe un descuento en pesos y anota el total.
4. B: pulsa **Guardar borrador**. En A, desliza la bandeja: la cotización sigue como **Por
   cotizar**, sin precios ni botones (migración 007).
5. B: pulsa **Enviar al cliente**. Queda como **Enviada**.
6. A: desliza la bandeja. La cotización llega como **Nueva** (punto azul). Ábrela: pasa a
   **Vista** y muestra líneas, descuento, IVA, servicio y el mismo total del paso 3.
7. A: pulsa **Aceptar y comprar** y confirma. Se abre **¡Pedido confirmado!** con "Pago simulado",
   el número `PED-…` y el mismo total.
8. A: pulsa **Agendar cita**. Si no hay ubicación, registra una: en el mapa marca el punto,
   escribe dirección y referencia y guarda.
9. A: elige fecha futura, franja y la ubicación; confirma. La cita queda **Programada** en
   Drawer > **Mis citas**.
10. B: pestaña **Cotizaciones**, recarga: la cotización está **Aceptada**. Pestaña **Citas**,
    recarga: aparece la cita **Programada**.
11. B: marca la cita como **Realizada**. En A, Mis citas muestra **Realizada** al recargar.

**Resultado esperado:** la cotización llega como Nueva, pasa a Vista y luego a Aceptada; se crea
un pedido con el mismo total y la cita queda Programada y visible para el trabajador (RF-15 a
RF-22, RF-26, RF-27).

**Resultado obtenido:** **Aprobado** con dos dispositivos iPhone con Expo Go.

- Pasos 1 a 7 (Felipe, 2026-11-11, ya con la 007): solicitud "Por cotizar", borrador que el cliente
  sigue viendo sin precios, envío, Nueva con punto azul que pasa a Vista, aceptación con pedido
  **PED-00005** y "Pago simulado"; lista del trabajador sin cambios. Fuente: bitácora, filas J5 y
  migración 007 (PR #13, #14).
- Caso completo, pasos 1 a 11 (solicitud → cotización → aceptar → agendar cita → la ve el
  trabajador → Realizada): aprobado en la revisión de J6, **comprobado a la vista, sin captura**.
  Fuente: comentario del PR #16 y bitácora, fila J6.

**Evidencia:** `docs/evidencias/cp01-pedido-confirmado.png`,
`docs/evidencias/f-borrador-oculto-por-cotizar.png`, `docs/evidencias/f-borrador-oculto.txt`,
`docs/evidencias/f5-prueba-solicitud.txt`, `docs/evidencias/f6-prueba-borrador.txt`; PR #9, #11,
#13, #14 y #16 (comentario de la revisión de J6). La parte de la cita no tiene captura.

**Código que lo implementa**

| Paso | Archivo |
| --- | --- |
| Solicitud | `app/(cliente)/flujos/solicitar-cotizacion.tsx`, `src/services/cotizaciones.service.ts`, `supabase/migrations/005_solicitud_cotizacion.sql` |
| Lista y elaboración | `app/(trabajador)/(drawer)/(tabs)/cotizaciones.tsx`, `app/(trabajador)/flujos/cotizacion-form.tsx`, `src/hooks/useCalculoTotal.ts`, `supabase/migrations/006_borrador_cotizacion.sql` |
| Borrador oculto | `supabase/migrations/007_borrador_oculto_cliente.sql`, `src/mappers/cotizacion.mapper.ts` |
| Bandeja y detalle | `app/(cliente)/(drawer)/(tabs)/cotizaciones.tsx`, `app/cotizacion/[id].tsx`, `src/hooks/useCotizaciones.ts` |
| Aceptar | `src/components/AccionesCotizacionCliente.tsx`, `app/(cliente)/flujos/confirmacion-pedido.tsx`, `supabase/migrations/003_funciones.sql` (`aceptar_cotizacion`) |
| Ubicación y cita | `app/(cliente)/flujos/mapa.tsx`, `app/(trabajador)/flujos/ubicacion-form.tsx`, `app/(cliente)/flujos/agendar-cita.tsx`, `app/(trabajador)/(drawer)/(tabs)/citas.tsx` |

---

## CP-02 — Permiso de ubicación denegado

**Dispositivos:** uno, con `cliente@cse.test`. Antes, borra el permiso de ubicación de Expo Go
(Ajustes del teléfono > Apps > Expo Go > Permisos > Ubicación > No permitir / Preguntar).

**Pasos**

1. Abre la app: comprueba que **no** pide el permiso al iniciar (RNF-13).
2. Drawer > **Ubicación del negocio**: el mapa carga con el marcador del negocio.
3. Pulsa **Mi ubicación**. Cuando el sistema pregunte, elige **No permitir**.
4. Lee el mensaje y comprueba que aparece el botón **Abrir ajustes**.
5. Sal del mapa y usa **Catálogo**, **Carrito** y **Cotizaciones**: funcionan sin GPS.

**Resultado esperado:** aparece un mensaje que explica para qué se usa la ubicación y un botón para
abrir Ajustes; catálogo, carrito y bandeja siguen funcionando (RF-24).

**Resultado obtenido:** **Aprobado**, comprobado a la vista en iPhone con Expo Go, sin captura,
en la revisión de J4 (PR #12), después del commit "J4: ajustes de revisión para iOS": el permiso
se pide solo al pulsar y, al negarlo, aparece la tarjeta con la explicación y Abrir ajustes.

**Evidencia:** revisión del PR #12 (sin captura); bitácora, fila J4.

**Código:** `src/hooks/useUbicacion.ts` (pide el permiso solo al pulsar), `src/components/AvisoUbicacion.tsx`,
`app/(cliente)/flujos/mapa.tsx` (botón Abrir ajustes), `app/(cliente)/(drawer)/ubicacion-negocio.tsx`.

---

## CP-03 — Regreso desde Ajustes

**Dispositivos:** uno, con `cliente@cse.test`, a continuación de CP-02.

**Pasos**

1. Con el permiso negado y el mensaje de CP-02 en pantalla, pulsa **Abrir ajustes**.
2. En Ajustes concede la ubicación a Expo Go ("Mientras se usa la app").
3. Vuelve a Expo Go con el botón atrás o el selector de apps (sin cerrar la app).

**Resultado esperado:** la app reconoce el permiso al volver y centra el mapa sin reiniciarse
(RF-24).

**Resultado obtenido:** **Aprobado**, comprobado a la vista en iPhone con Expo Go, sin captura,
en la revisión de J4 (PR #12, después del ajuste de iOS): al volver desde Ajustes la app reconoce
el permiso sin reiniciarse.

**Evidencia:** revisión del PR #12 (sin captura); bitácora, fila J4.

**Código:** `src/hooks/useUbicacion.ts` (listener de `AppState` que vuelve a comprobar el permiso
al pasar a primer plano y se libera en la limpieza del efecto).

---

## CP-04 — GPS desactivado

**Dispositivos:** uno, con `cliente@cse.test` (con el permiso ya concedido).

**Pasos**

1. Apaga la ubicación del teléfono (panel rápido > Ubicación).
2. Abre Drawer > **Ubicación del negocio** y pulsa **Mi ubicación**.
3. Comprueba que el botón no queda cargando.
4. Enciende la ubicación y vuelve a pulsar **Mi ubicación**: centra en tu posición.

**Resultado esperado:** se muestra "Active la ubicación del dispositivo" y la pantalla no queda
cargando (RF-24).

**Resultado obtenido:** **Aprobado**, comprobado a la vista en iPhone con Expo Go, sin captura,
en la revisión de J4 (PR #12, después del ajuste de iOS): con la localización apagada aparece
"Active la ubicación del dispositivo" y no queda cargando.

**Evidencia:** revisión del PR #12 (sin captura); bitácora, fila J4.

**Código:** `src/hooks/useUbicacion.ts` (revisa primero que la ubicación del sistema esté
encendida y luego el permiso, ajuste de iOS del PR #12; `obtenerActual` con tiempo límite).

---

## CP-05 — Seguimiento y liberación

**Dispositivos:** uno, con `cliente@cse.test` o `trabajador@cse.test`, con permiso y GPS activos.
Conviene caminar unos metros o probarlo en exteriores.

**Pasos**

1. Abre el mapa y pulsa **Activar seguimiento**. Muévete: el marcador del dispositivo se mueve.
   Observa el indicador de ubicación del sistema (barra de estado).
2. Pulsa **Pausar**: el marcador deja de moverse.
3. Pulsa **Reanudar**: vuelve a moverse.
4. Sal del mapa con el botón atrás: el indicador de ubicación del sistema desaparece en unos
   segundos.
5. Repite con el seguimiento activo y manda la app a segundo plano: el indicador también se va.

**Resultado esperado:** el marcador se mueve solo mientras el seguimiento está activo; al salir
desaparece el indicador de ubicación del sistema (RF-25, RNF-14).

**Resultado obtenido:** **Aprobado**, comprobado a la vista en iPhone con Expo Go, sin captura,
en la revisión de J4 (PR #12, después del ajuste de iOS): el seguimiento funciona y la flecha de
ubicación del sistema desaparece al salir del mapa y al pasar a segundo plano.

**Evidencia:** revisión del PR #12 (sin captura); bitácora, fila J4.

**Código:** `src/hooks/useUbicacion.ts` (`watchPositionAsync`; la suscripción se libera al
pausar, en `useFocusEffect` al salir, al pasar a segundo plano y al desmontar),
`src/components/PanelSeguimiento.tsx`, `src/store/mapaStore.ts`.

---

## CP-06 — Sin conexión

**Dispositivos:** dos. A con `cliente@cse.test`, B con `trabajador@cse.test`.

**Pasos**

1. B: abre una cotización en Borrador (Crear cotización > continuar borrador). Activa el **modo
   avión** y pulsa **Enviar al cliente**. Aparece el error, la cotización sigue en Borrador y lo
   escrito se conserva. Quita el modo avión y pulsa **Reintentar**: se envía.
2. A: agrega un producto al carrito. Activa el modo avión y pulsa **Confirmar pedido**. Aparece el
   aviso de que no se pudo confirmar; no hay pantalla de pedido confirmado y el carrito se
   conserva. Quita el modo avión y pulsa **Reintentar**: se crea **un** pedido.
3. A: Agendar cita con modo avión: aviso sin confirmación. Sin modo avión, **Reintentar**: la cita
   queda Programada una sola vez.
4. A: abre una cotización Nueva o Vista, modo avión, **Rechazar**: el estado no cambia. Sin modo
   avión, **Reintentar**: queda Rechazada.
5. En B, recarga Cotizaciones y Citas y en A Mis pedidos: no hay registros repetidos.

**Resultado esperado:** cada acción muestra un error y no crea registros; con conexión, el
reintento completa la acción (RNF-08).

**Resultado obtenido:** **Aprobado**, en pruebas separadas:

- Enviar cotización (paso 1): aprobado con Expo Go (F6, 2026-11-11, PR #11): "envío en modo avión
  con mensaje de error, sin confirmación falsa y completado con Reintentar al volver la conexión".
- Confirmar pedido y cambiar el estado de una cita sin conexión, con Reintentar: aprobados con dos
  dispositivos en la revisión de J6 (PR #16, a la vista en iPhone, sin captura; comentario del PR).
- Confirmar pedido y agendar cita (pasos 2 y 3): aprobados de nuevo con dos dispositivos (migración
  008, 2026-11-12, PR #18): "compra sin conexión con Reintentar que creó un solo pedido y descontó
  el inventario una vez" y "cita sin conexión con Reintentar sin duplicar".
- Rechazar (paso 4): aprobado en iPhone (J5, 2026-11-11): "rechazar en modo avión no cambió el
  estado y Reintentar completó el rechazo al volver la conexión".

**Evidencia:** bitácora, filas F6, J5, J6 y 008; `docs/evidencias/f-008-compras-citas.txt` (casos
4, 9 y 12: mismo identificador de compra, llamadas simultáneas y cita repetida en el servidor); PR
#11, #13, #16, #18. Sin captura en el teléfono.

**Código:** `src/services/api.ts` (interceptor de respuesta: error `sin_conexion`),
`src/components/ConfirmarCompraCarrito.tsx` y `src/store/carritoStore.ts` (`compraId`),
`src/components/AvisoErrorAccion.tsx`, `src/components/AvisoConexion.tsx`,
`app/(trabajador)/flujos/cotizacion-form.tsx`, `app/(cliente)/flujos/agendar-cita.tsx`,
`src/components/AccionesCotizacionCliente.tsx`, `supabase/migrations/008_compras_y_citas.sql`.

---

## CP-07 — Cantidad mayor al inventario

**Dispositivos:** uno, con `cliente@cse.test`. Antes, con `trabajador@cse.test` en **Productos**,
comprueba que el DVR `DS-7204HGHI-M1(C)` tenga inventario 2 (las compras de prueba pueden haberlo
bajado; si cambió, ajústalo a 2 con Editar).

**Pasos**

1. **Catálogo**: busca `DS-7204` y abre el DVR.
2. Pulsa **+** tres veces: el contador se detiene en 2 y aparece "Solo hay 2 unidades disponibles".
3. Escribe **5** a mano en la cantidad: se rechaza con mensaje.
4. Prueba también vacío, `1.5` y `abc` en la cantidad: cada uno se rechaza.
5. Agrega 2 al carrito y vuelve al detalle: **Agregar al carrito** queda bloqueado.

**Resultado esperado:** el contador se detiene en 2, aparece "Solo hay 2 unidades disponibles" y la
cantidad escrita se rechaza (RF-10).

**Resultado obtenido:** **Aprobado.**

- En la app: aprobado en la revisión de J3 (PR #10), comprobado a la vista en iPhone con Expo Go,
  sin captura, incluido escribir 5 a mano. La bitácora F7 (2026-11-12) confirma que "CP-07 sigue
  funcionando con el DVR DS-7204HGHI-M1(C)" con los datos reales del Excel.
- En el servidor: comprar 3 unidades del DVR responde "Solo hay 2 unidades disponibles de DVR 4
  canales Turbo HD 1080p Lite" (captura del SQL Editor) y lo mismo con los datos reales
  (`f7-carga-inventario.txt`, caso D11).

**Evidencia:** revisión del PR #10 (sin captura); `docs/evidencias/f2-10-cp07-inventario-insuficiente.png`,
`docs/evidencias/f7-carga-inventario.txt`; PR #10, #15.

**Código:** `src/components/ContadorCantidad.tsx` (límite, mensaje y cantidad escrita),
`app/producto/[id].tsx` (máximo = inventario − lo que ya está en el carrito),
`src/store/carritoStore.ts`, `src/utils/validaciones.ts`, `supabase/migrations/003_funciones.sql`
(revisión en el servidor con bloqueo).

---

## CP-08 — Campos vacíos o no numéricos

**Dispositivos:** uno, con `trabajador@cse.test` (o `admin@cse.test`).

**Pasos**

1. Pestaña **Productos** > **+**. Deja el nombre vacío, escribe `abc` en el precio cliente final
   (si el teclado numérico no deja, pega el texto o escribe `79.000` o `-5`) y pulsa **Guardar**.
2. Comprueba el mensaje bajo cada campo y que en Productos no apareció nada nuevo.
3. Pestaña **Cotizaciones** > **Crear cotización**. Elige un cliente y un producto.
4. En el descuento: déjalo vacío, escribe `20.000`, `-` o pega texto. Escribe luego un descuento
   mayor al subtotal.
5. Comprueba que el resumen no se calcula con valores inválidos y que **Guardar borrador** y
   **Enviar** no guardan nada.

**Resultado esperado:** cada campo muestra su mensaje y no se guarda nada (RF-17, RF-29).

**Resultado obtenido:** **Aprobado.**

- Cotización (pasos 3 a 5): aprobado con Expo Go (F6, 2026-11-11, PR #11, "CP-08 en el
  descuento"). El teclado numérico no deja escribir letras; se prueba con vacío, "20.000", "-" o
  pegando texto.
- Formulario de producto (pasos 1 y 2): aprobado en la revisión de J7 (PR #17), comprobado a la
  vista en iPhone con Expo Go, sin captura.

**Evidencia:** bitácora F6 y J7; revisión del PR #17 (sin captura);
`docs/evidencias/f6-prueba-borrador.txt` (caso 4: validaciones del servidor); PR #11, #17.

**Código:** `app/(trabajador)/flujos/producto-form.tsx`, `src/utils/validaciones.ts`
(`valorEnPesos`, `inventarioValido`, "Ingrese un valor numérico"),
`app/(trabajador)/flujos/cotizacion-form.tsx`, `src/hooks/useCalculoTotal.ts`,
`src/utils/calculos.ts`.

---

## CP-09 — Identificador inexistente

**Dispositivos:** uno, con `cliente@cse.test`.

**Pasos**

1. En el navegador del teléfono abre `exp://<IP>:8081/--/producto/abc`. Aparece "Producto no
   encontrado" con **Volver al catálogo**; púlsalo.
2. Repite con un uuid que no existe, por ejemplo
   `exp://<IP>:8081/--/producto/00000000-0000-0000-0000-000000000000`.
3. Abre `exp://<IP>:8081/--/cotizacion/abc`. Aparece "Cotización no encontrada" con **Volver a
   cotizaciones**.

**Resultado esperado:** se muestran "Producto no encontrado" y "Cotización no encontrada" con
opción de volver (RF-08, RF-21).

**Resultado obtenido:** **Parcial.**

- Cotización (paso 3): **aprobado** en iPhone (J5, 2026-11-11): "Cotización no encontrada" al abrir
  `/cotizacion/abc`; repetido en la prueba de la 007.
- Producto (pasos 1 y 2): **Pendiente de probar en el teléfono.** Es el único caso pendiente.
  Solo está comprobado en el servicio: un id inexistente devuelve lista vacía y
  `obtenerProducto` responde null (`f4-prueba-productos.txt`).

**Evidencia:** bitácora J5 y 007; `docs/evidencias/f4-prueba-productos.txt`; PR #7, #10, #13.

**Código:** `app/producto/[id].tsx`, `src/services/productos.service.ts` (id mal formado → null),
`src/hooks/useProductos.ts` (`useProducto`), `app/cotizacion/[id].tsx`,
`src/services/cotizaciones.service.ts`.

---

## CP-10 — Datos conservados

**Dispositivos:** uno, con `cliente@cse.test`.

**Pasos**

1. Registra un pedido desde el carrito y agenda una cita.
2. Deja un producto en el carrito sin comprar.
3. Cierra la app por completo (deslízala fuera de las apps recientes; también cierra Expo Go).
4. Vuelve a abrir Expo Go y el proyecto.
5. Comprueba: entra directo a Inicio sin pedir sesión; el carrito tiene el producto del paso 2;
   el pedido está en Drawer > **Mis pedidos** y la cita en **Mis citas**.

**Resultado esperado:** la sesión sigue activa y el pedido y la cita aparecen en Mis pedidos y Mis
citas (RNF-09).

**Resultado obtenido:** **Aprobado**, comprobado a la vista en iPhone con Expo Go, sin captura, en
la revisión de J6 (PR #16; comentario del PR): al reabrir la app siguen la sesión, el carrito, el
pedido y la cita. Relacionado: la prueba de 008 (PR #18) cerró la app a mitad de una compra y al
volver no se duplicó el pedido.

**Evidencia:** revisión del PR #16 (sin captura); bitácora, fila J6.

**Código:** `src/store/sesionStore.ts` y `src/store/carritoStore.ts` (Zustand con `persist` en
AsyncStorage), `app/index.tsx` (espera la hidratación y abre las pestañas del rol),
`app/(cliente)/(drawer)/mis-pedidos.tsx`, `app/(cliente)/(drawer)/mis-citas.tsx`,
`src/hooks/usePedidos.ts`, `src/hooks/useCitas.ts`.

---

## CP-11 — Cliente sin acceso a costos

**Dispositivos:** uno, con `cliente@cse.test`, más el computador para las respuestas HTTP.

**Pasos**

1. Revisa **Catálogo**, un **Detalle de producto** y un **Detalle de cotización**: no aparece
   costo ni ganancia.
2. En el computador, en una terminal nueva, define las contraseñas en variables de entorno (ver
   README, "npm run verificar-seguridad") y ejecuta `npm run verificar-seguridad`.
3. Comprueba que termina con `Resultado: 0 falla(s)` y cierra la terminal.

**Resultado esperado:** no aparecen el costo ni las ganancias en pantallas ni en respuestas
(RNF-06).

**Resultado obtenido:** **Aprobado.**

- Respuestas HTTP: `npm run verificar-seguridad` contra Supabase (2026-11-13): catálogo con 77
  filas, cotizaciones y pedidos sin costo ni ganancia; tabla `productos` y costos de las ventas
  vacíos; ganancias con "Acceso no autorizado"; y el trabajador sí recibe el costo. **0 fallas.**
- Pantallas: aprobado en iPhone (J5, 2026-11-11): "el cliente no ve costo ni ganancia en el
  detalle".

**Evidencia:** `docs/evidencias/c1-verificar-seguridad.txt`, `docs/evidencias/f4-prueba-productos.txt`,
`docs/evidencias/f2-02-cliente-catalogo-sin-costo.png`, `docs/evidencias/f2-03-cliente-costo-no-existe.png`,
`docs/evidencias/f2-06-cliente-sin-ganancias.png`; PR #3, #7, #14, #19, #21.

**Código:** `supabase/migrations/002_seguridad.sql` (vista `productos_catalogo` sin costo),
`supabase/migrations/007_borrador_oculto_cliente.sql`, `supabase/migrations/009_costo_ventas.sql`,
`src/models/Producto.ts` (el modelo del cliente no tiene costo), `src/mappers/producto.mapper.ts`,
`scripts/verificar-seguridad.mjs`.

---

## CP-12 — Acceso por rol

**Dispositivos:** uno; se repite con `cliente@cse.test` y con `trabajador@cse.test`.

**Pasos**

1. Inicia sesión como cliente. En el navegador del teléfono abre
   `exp://<IP>:8081/--/usuarios`: aparece "Acceso no autorizado" con **Ir al inicio**.
2. Repite con `exp://<IP>:8081/--/panel`.
3. Cierra sesión, entra como trabajador y repite los pasos 1 y 2.
4. Entra como administrador: Usuarios y roles y Panel sí abren.

**Resultado esperado:** la app muestra "Acceso no autorizado" o redirige al inicio del cliente
(RF-34, RNF-05).

**Resultado obtenido:** **Aprobado** en un teléfono real con Expo Go (F8, 2026-11-13, PR #19): "CP-12 con /usuarios
y /panel como trabajador y como cliente ('Acceso no autorizado')". En el servidor, una petición
para crear un producto con token de cliente da HTTP 403 / 42501 y modificarlo cambia 0 filas
(`c1-verificar-seguridad.txt`).

**Evidencia:** bitácora F8 y J3 (corrección de `/panel`); `docs/evidencias/c1-verificar-seguridad.txt`,
`docs/evidencias/f2-05-cliente-no-crea-productos.png`, `docs/evidencias/f2-07-cliente-no-cambia-rol.png`;
PR #8, #10, #19.

**Código:** `src/components/RutaProtegida.tsx`, `src/hooks/useRequiereRol.ts`,
`src/components/PantallaAccesoNoAutorizado.tsx`, `app/(trabajador)/(drawer)/usuarios.tsx`,
`app/(trabajador)/(drawer)/(tabs)/panel.tsx`, `app/(trabajador)/(drawer)/(tabs)/_layout.tsx`
(pestaña Panel oculta con `tabBarButton`), `supabase/migrations/002_seguridad.sql`,
`supabase/functions/admin-usuarios/index.ts`.
