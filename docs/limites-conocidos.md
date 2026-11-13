# Límites conocidos

Prompt C1 (cierre). Reúne los límites anotados en `docs/bitacora.md`, `docs/servicio-remoto.md`
(secciones 8 y 9) y `docs/cambios-estructura.md`, más los de la sección 12 de la documentación.
Cada uno dice por qué existe y cómo se resolvería en una versión siguiente. Ninguno impide
completar el proceso principal.

## Servicio remoto (Supabase)

| Límite | Por qué | Cómo se resolvería |
| --- | --- | --- |
| **El proyecto se pausa tras una semana sin uso** (plan gratuito). Mientras está pausado la app muestra error con Reintentar en todas las pantallas. | Es una condición del plan gratuito de Supabase. Además hay cuotas (500 MB de base, transferencia y usuarios activos mensuales). | Antes de cada demostración entrar al panel y pulsar **Restore project**. Para uso real del negocio, pasar al plan Pro (no se pausa) o mantener actividad periódica. |
| **Sin Leaked Password Protection.** Supabase no revisa si una contraseña aparece en filtraciones conocidas; solo exige 6 caracteres. | La opción no está disponible en el plan gratuito. Es la advertencia aceptada del Security Advisor. | Plan Pro y activar la opción en **Authentication > Providers > Email**; mientras tanto, subir la longitud mínima de contraseña en el panel. |
| **Requiere conexión.** Sin internet no se guarda nada nuevo; se muestra la caché con aviso. | Los datos del negocio viven en el servidor para compartirse entre teléfonos (RNF-10). Guardar offline y sincronizar después podría vender unidades que ya no existen. | Cola de operaciones offline con resolución de conflictos; fuera del alcance del curso. |
| **Los cambios se ven al recargar, no en tiempo real.** Una cotización enviada aparece al deslizar la bandeja o al volver a la pantalla. | No se usa Supabase Realtime (WebSocket) para mantener todo el acceso por HTTP con Axios. | Supabase Realtime o notificaciones push (expo-notifications) cuando cambie una cotización o una cita. |
| **No hay notificaciones.** El cliente no recibe aviso de una cotización nueva. | Fuera del alcance acordado (sección 12). | expo-notifications con una Edge Function que envíe el aviso al cambiar el estado. |
| **Números de cotización y pedido con saltos** (`COT-00007` y luego `COT-00009`). | Una operación que falla consume el número de la secuencia de PostgreSQL. | Es normal en PostgreSQL; si el negocio exige números seguidos, una tabla de consecutivos bloqueada en la misma transacción. |

## Productos e inventario

| Límite | Por qué | Cómo se resolvería |
| --- | --- | --- |
| **Un producto desactivado no se puede reactivar desde la app.** "Eliminar" lo desactiva y deja de aparecer en Productos y en el catálogo. | RF-31 pide eliminar; el equipo decidió desactivar para conservar las líneas de cotizaciones y pedidos. Reactivar no estaba en el alcance. | Un filtro "Desactivados" en Productos con un botón Reactivar (`PATCH activo = true`). Hoy se hace en Supabase: **Table Editor > productos**, `activo = true`. |
| **El código de un producto desactivado no se puede reutilizar.** | El índice único `upper(trim(codigo))` cuenta también los desactivados, para que un código nunca apunte a dos productos distintos en el historial. | Reactivar el producto (fila anterior) en vez de crear otro con el mismo código. |
| **Carrito con un producto que se desactivó después.** El carrito local (AsyncStorage) puede conservar una línea de un producto que el trabajador desactivó; al confirmar, el servidor rechaza la compra con "Producto no encontrado" y el carrito se conserva. | El carrito se guarda en el teléfono (RNF-09) y no se revisa contra el servidor al abrir la app. | Al abrir el Carrito, comparar las líneas con el catálogo y marcar o quitar las que ya no existen, con un aviso. Hoy el cliente quita la línea con Eliminar. |
| **Ejecutar dos veces la carga del inventario** (`inventario_inicial.sql`) vuelve a poner los datos del Excel. No duplica productos, pero se pierden los cambios de precios o inventario hechos en la app después de la primera carga. | El script está pensado para la carga inicial (RF-32): actualiza por código con los valores del Excel. | Ejecutarlo una sola vez. Para cargas posteriores, un script que solo inserte productos nuevos o que pida confirmación por producto. |
| **Reglas de depuración del Excel de prueba**: duplicados → última fila de la hoja más reciente (inventario sumado), sin código → `SIN-COD-001…`, negativo → 0, marca y categoría deducidas del nombre. | El cliente aún no confirma cómo unificar ni qué códigos asignar (RF-32). | Confirmarlas en la reunión (`docs/valores-por-confirmar.md`), ajustar `scripts/depurar-inventario.mjs` y regenerar con `npm run depurar-inventario`. |
| **La imagen del producto se registra con su URL**, no se elige del teléfono. | Elegir una foto exige `expo-image-picker` y almacenamiento de archivos; el equipo decidió no agregar librerías. | expo-image-picker + Supabase Storage con políticas por rol. |
| **No se reserva inventario durante una cotización.** Dos cotizaciones pueden incluir las mismas unidades; la disponibilidad se revisa al aceptar o al comprar. | Decisión del equipo (CLAUDE.md) mientras el cliente no defina la regla (RF-16). | Si el cliente lo pide: una columna de unidades reservadas que se libera al vencer o rechazar la cotización. |

## Pedidos, ventas y ganancias

| Límite | Por qué | Cómo se resolvería |
| --- | --- | --- |
| **Pedido solo en estado Pendiente.** | Decisión del equipo: RF-14 deja los estados y quién los cambia por confirmar con el cliente. | Definir los estados (por ejemplo Pagado, Entregado) y una pantalla de pedidos para el personal que los cambie. |
| **Sin pago real.** El paso de pago dice "Pago simulado". | Fuera del alcance (sección 5). | Integrar una pasarela (Wompi, Mercado Pago) con una Edge Function que confirme el pago. |
| **El trabajador no abre el detalle de un pedido desde el historial del cliente**, ni tiene una lista de pedidos (la tarjeta "Pedidos del mes" del Panel no se puede tocar). | El Detalle de pedido es una ruta del cliente (`app/(cliente)/flujos/pedido/[id].tsx`) protegida para ese rol; la documentación no pide pedidos para el personal. | Abrir la ruta al personal (RLS ya le deja leer todos los pedidos) o crear un detalle de pedido del trabajador, y enlazarlo desde el historial y el Panel. |
| **Costo de los pedidos anteriores a la migración 009.** Sus líneas quedaron con el costo que tenía el producto al ejecutar 009, no con el de la fecha de venta. | Antes de 009 el costo de cada venta no se guardaba. | Ninguna corrección automática es posible; si importa, corregir a mano esas filas de `pedido_lineas_costo` con el costo real de cada compra. |
| **La ganancia por producto no reparte el descuento** del pedido ni incluye el servicio de instalación o mantenimiento. | RF-35 la define como (precio de venta − costo) × unidades, igual que las columnas del Excel. | Si el cliente lo pide, repartir el descuento proporcionalmente entre las líneas y mostrar el servicio como un renglón aparte. |

## Usuarios y sesión

| Límite | Por qué | Cómo se resolvería |
| --- | --- | --- |
| **Contraseña temporal sin cambio obligatorio.** El administrador crea el usuario con una contraseña que entrega en persona; la app no obliga a cambiarla en el primer inicio de sesión. | La app no envía correos y Supabase Auth no tiene "cambio obligatorio" sin lógica propia. | Una marca `debe_cambiar_contrasena` en `perfiles` y una pantalla que use `PUT /auth/v1/user` antes de entrar; o enviar una invitación por correo con un SMTP configurado. |
| **El correo de una cuenta no se cambia desde la app.** | Cambiarlo exige confirmar el correo nuevo y la app no envía correos. | Agregar la acción a la Edge Function `admin-usuarios` (con la llave secreta) o habilitar el cambio con confirmación por correo. |
| **"Confirm email" apagado.** Quien se registra entra sin confirmar su correo. | La app no tiene un flujo de confirmación y el plan gratuito limita los correos. | Configurar un SMTP propio, encender "Confirm email" y usar el aviso que la app ya muestra ("Debes confirmar tu correo…"). |
| **Un token emitido sigue válido hasta 1 hora** después de desactivar al usuario. | Es el `access_token` de Supabase. Igual no recibe datos: las políticas RLS revisan `perfiles.activo` en cada petición, y desactivar también bloquea el inicio de sesión. | Bajar la duración del token en el panel (menos de 3600 s). |

## Navegación y alcance

| Límite | Por qué | Cómo se resolvería |
| --- | --- | --- |
| **Rutas `/perfil` y `/cotizaciones` duplicadas** en los grupos del cliente y del trabajador: un enlace profundo sin grupo es ambiguo. | Los grupos de Expo Router no aparecen en la URL. Dentro de la app siempre se navega con la ruta completa; si un enlace externo abre la del otro rol, se ve "Acceso no autorizado". | Renombrar una de las dos (por ejemplo `/bandeja` para el cliente) si se agregan enlaces profundos. |
| **Mapa: los marcadores de las ubicaciones no tienen indicador de carga**, y si falla una recarga se muestra el aviso de error aunque haya ubicaciones guardadas en la caché (que sí se siguen dibujando). | Mejora menor detectada en la auditoría de C1. El mapa, el GPS y el registro de ubicaciones funcionan; solo falta el aviso mientras llegan los marcadores y condicionar el error. | En `app/(cliente)/flujos/mapa.tsx`, mostrar un aviso pequeño "Cargando ubicaciones…" mientras la consulta está pendiente y mostrar el error solo cuando no hay datos (`consulta.isError && consulta.data === undefined`), como en las demás pantallas. |
| **Ubicación solo en primer plano** y solo mientras el mapa está abierto; no hay rutas ni distancias. | RNF-13, RNF-14 y la sección 12: no se rastrea en segundo plano y no se dibujan líneas que parezcan rutas reales. | Fuera del alcance. |
| **Reglas de citas de prueba**: lunes a sábado, cuatro franjas fijas, sin límite de cupos, sin reprogramar; solo el trabajador cambia el estado. | Horarios, cupos y reglas de cancelación están por confirmar con el cliente (RF-27, RF-28). | Pasarlos a una tabla en Supabase cuando el cliente los confirme y validar cupos en el trigger de citas. |
| **Valores de prueba** (IVA 19 %, tarifas 150 000 y 80 000, vigencia 15 días, coordenadas del negocio, umbral de stock bajo). | Por confirmar con el cliente (sección 12). | Ver `docs/valores-por-confirmar.md`. Los de cobro se cambian en `parametros_negocio` sin publicar la app. |
| **Probada en teléfonos reales con Expo Go**, sin publicar en tiendas. | La entrega no exige publicación. | APK con EAS Build (README) o publicación en Play Store / App Store. |
