**Documentación del proyecto final**

**Aplicación móvil ****Centro de Seguridad ****Electronica**

Asignatura: Desarrollo Móvil II

Integrantes: 

Felipe Obregon Castro

Juan Pablo Murillo Villalobos 

Docente: Sandra Milena Caicedo

Fecha: [Pendiente]

Fundación universitaria Vision de las Américas

	

**Tabla de contenido**

	1. Cliente y problema	4

	2. Alcance del proyecto	4

	3. Requerimientos funcionales	6

	3.1 Autenticación y roles	6

	3.2 Catálogo y búsqueda	7

	3.3 Carrito y compra	9

	3.4 Cotizaciones	10

	3.5 Bandeja de entrada del cliente	12

	3.6 Ubicación, mapa y citas	13

	3.7 Gestión de productos e inventario	15

	3.8 Gestión de clientes	16

	3.9 Administración	17

	4. Requerimientos no funcionales	17

	5. Reglas de negocio	20

	6. Mapa de pantallas	21

	7. Organización del código	22

	8. Matriz de requisitos	24

	9. Conservación de la información	26

	10. Pruebas y evidencias	26

	11. Prueba con el cliente y retroalimentación	28

	12. Límites conocidos	28

	13. Bitácora de avances	29

1. Cliente y problema

Nuestro cliente es una empresa que vende, instala y da mantenimiento a sistemas de cámaras de seguridad. Trabaja con productos de las marcas Hikvision, EZVIZ y HiLook: DVR, cámaras Turbo HD tipo bala, turret y domo, cámaras WiFi e IP, kits, alarmas y sensores, discos duros, fuentes, UPS y accesorios de cableado como cable UTP, video balun, conectores y cajas. Vende a dos tipos de compradores, instaladores y clientes finales, y maneja un precio distinto para cada uno.

El usuario principal de la app es el cliente que necesita cámaras para su casa o su negocio y quiere cotizar, comprar y agendar la instalación desde el teléfono. También la usan los trabajadores de la empresa, que preparan las cotizaciones y mantienen el inventario, y el administrador, que supervisa el sistema y gestiona los usuarios.

Hoy el inventario se lleva en un libro de Excel con una hoja por mes, de enero a octubre de 2026, y hojas aparte para la marca HiLook. Cada hoja registra el código, el producto, el costo, el precio para instalador, el precio para cliente final, el inventario inicial, las ventas a cada tipo de comprador, el inventario final, los valores de venta y las ganancias. Este registro sirve para el control interno, pero el cliente no tiene forma de consultar qué productos hay ni a qué precio, y para conocer la disponibilidad actual hay que ubicar la hoja más reciente. Además, al revisar los datos encontramos productos sin código, códigos repetidos con costos distintos, precios para instalador vacíos y, en las hojas de febrero y agosto, inventarios finales negativos porque se registraron más ventas que unidades disponibles.

El Excel no muestra cómo se elaboran hoy las cotizaciones ni cómo se agendan las citas de instalación o mantenimiento: [Por confirmar con el cliente].

Con la app, el inventario pasa a un servicio remoto que comparten todos los usuarios. El cliente consulta el catálogo, pide una cotización y la recibe en su bandeja; después la acepta, la convierte en pedido y agenda la visita marcando su ubicación en el mapa. Por su parte, el trabajador arma cada cotización con los productos y las existencias reales, y el administrador consulta las ventas y ganancias que hoy se calculan en las columnas del Excel (RF‑35). Esperamos así reducir los errores del registro manual y que el cliente pueda hacer todo el proceso sin depender de llamadas o mensajes sueltos.

2. Alcance del proyecto

El proceso principal va desde la solicitud de una cotización hasta la cita de instalación o mantenimiento. Empieza cuando el cliente indica el tipo de servicio y describe lo que necesita (RF‑15). Un trabajador recibe la solicitud, agrega productos del inventario con sus cantidades y la app calcula el total (RF‑16, RF‑17). Al enviarla, la cotización queda guardada en el servicio remoto y llega a la bandeja del cliente (RF‑18, RF‑20). El cliente abre el detalle, la acepta y la app la convierte en un pedido con las mismas líneas y el mismo total (RF‑21, RF‑22). Por último, registra el lugar del servicio en el mapa y agenda la cita (RF‑26, RF‑27), que luego el trabajador atiende y actualiza (RF‑28).

En este proceso entran los datos del cliente, el tipo de servicio, los productos con sus precios y existencias, las cantidades, el descuento, el costo del servicio, la ubicación y la fecha de la cita. Sobre esos datos aplicamos las reglas de la sección 5, sobre todo el límite de cantidades según el inventario y la forma de calcular el total. Como resultado, el cliente obtiene una cotización detallada, un pedido registrado con su número y una cita programada que puede consultar cuando quiera.

Alrededor del proceso principal desarrollamos varias funciones complementarias. El catálogo muestra los productos con búsqueda por nombre o código y filtro por categoría y marca (RF‑05 a RF‑08); desde allí el cliente también puede comprar directamente con el carrito, sin pasar por una cotización (RF‑10 a RF‑14). Los trabajadores mantienen los productos, los precios y el inventario (RF‑29 a RF‑32) y la información de los clientes (RF‑33). La gestión de usuarios y roles queda en manos del administrador (RF‑34).

Cada rol ve solo lo que le corresponde (RF‑03, RNF‑05). El cliente consulta el catálogo, compra, solicita y acepta cotizaciones, registra sus ubicaciones y agenda citas. El trabajador elabora y envía cotizaciones, administra productos, inventario y clientes, registra ubicaciones a nombre de un cliente y actualiza el estado de las citas. El administrador puede hacer todo lo del trabajador y, además, crea usuarios, les asigna un rol y consulta las ventas y ganancias.

3. Requerimientos funcionales

Los requerimientos se agrupan por módulo y siguen el proceso principal: el cliente solicita una cotización, el trabajador la elabora con productos del inventario y la envía, el cliente la recibe en su bandeja, la acepta y la convierte en compra, y luego registra su ubicación y agenda la cita de instalación o mantenimiento. La compra se registra como pedido, sin pasarela de pago real. Cotizaciones, pedidos y citas se guardan en un servicio remoto compartido entre dispositivos. El costo y las ganancias nunca son visibles para el cliente.

Los datos marcados como [Por confirmar con el cliente] no están definidos en el inventario ni en el alcance acordado y deben validarse antes de implementarse.

3.1 Autenticación y roles

| **ID** | **Nombre** | **Descripción** | **Rol o roles** | **Prioridad** | **Criterio de aceptación** | **Tema del curso relacionado** |
| --- | --- | --- | --- | --- | --- | --- |
| RF‑01 | Inicio de sesión | El usuario ingresa con correo y contraseña; el sistema identifica su rol (cliente, trabajador o administrador). | Cliente, trabajador, administrador | Alta | Con credenciales válidas se abre la pantalla de inicio del rol correspondiente. Con campos vacíos se muestra un mensaje por campo y no se envía la petición; con correo mal formado se indica el formato esperado; con credenciales incorrectas se muestra un mensaje sin revelar cuál dato falló; sin conexión se informa y no se abre sesión. | Formulario con validaciones; Axios |
| RF‑02 | Registro de cliente | Una persona crea su cuenta de cliente con nombre, correo, teléfono y contraseña. | Cliente | Media | Con datos válidos la cuenta queda creada con rol cliente y puede iniciar sesión. Campos vacíos, correo inválido, teléfono no numérico o correo ya registrado muestran un mensaje específico. Si se permite el autorregistro o solo el trabajador crea clientes: [Por confirmar con el cliente]. | Formulario con validaciones |
| RF‑03 | Navegación según rol | La app usa Tabs para las secciones frecuentes, Stack para los flujos con retroceso y Drawer para accesos complementarios, y muestra solo las opciones del rol. El administrador tiene acceso a todas las funciones del trabajador y a la administración. | Cliente, trabajador, administrador | Alta | El cliente ve en Tabs Catálogo, Carrito, Bandeja y Citas; el trabajador ve además Cotizaciones, Productos y Clientes; el administrador ve también Usuarios. El Drawer abre Perfil, Mis pedidos, Ubicación del negocio y Cerrar sesión. El botón atrás regresa a la pantalla anterior del flujo. Ningún botón o ícono queda sin acción y no hay rutas rotas. | Navegación Stack, Tabs o Drawer |
| RF‑04 | Sesión persistente y cierre de sesión | La sesión se conserva al cerrar y reabrir la app hasta que el usuario la cierre. | Cliente, trabajador, administrador | Media | Al cerrar y reabrir la app el usuario sigue autenticado con su rol. Al cerrar sesión se borran el token y los datos locales del usuario y se vuelve al inicio de sesión. Si el token expiró, se pide iniciar sesión de nuevo. | Conservación de datos; Zustand |

3.2 Catálogo y búsqueda

| **ID** | **Nombre** | **Descripción** | **Rol o roles** | **Prioridad** | **Criterio de aceptación** | **Tema del curso relacionado** |
| --- | --- | --- | --- | --- | --- | --- |
| RF‑05 | Listado del catálogo | Muestra los productos del inventario (Hikvision, EZVIZ y HiLook) obtenidos del servicio remoto, con nombre, código, marca, categoría, precio y disponibilidad. | Cliente, trabajador, administrador | Alta | Al abrir Catálogo se ve un indicador de carga y luego la lista. Si la petición falla se muestra un mensaje con botón Reintentar; sin productos se muestra un estado vacío; sin conexión se muestran los datos en caché, si existen, con un aviso. El cliente nunca ve costo ni ganancia. Qué precio ve cada rol (precio instalador o precio cliente final): [Por confirmar con el cliente]. | Axios, TanStack Query y mapper |
| RF‑06 | Búsqueda de productos | Búsqueda por texto sobre el nombre o el código del producto. | Cliente, trabajador, administrador | Alta | Al escribir "DVR" la lista muestra solo los productos cuyo nombre o código contiene ese texto, sin distinguir mayúsculas ni tildes. Sin coincidencias aparece un mensaje y una opción para limpiar la búsqueda. Los productos sin código se encuentran por nombre. | Búsqueda o filtro |
| RF‑07 | Filtro por categoría y marca | Filtra por categoría (DVR; cámaras Turbo HD bala, turret y domo; cámaras WiFi e IP; kits; alarmas y sensores; discos duros; fuentes y UPS; accesorios de cableado) y por marca. | Cliente, trabajador, administrador | Alta | Al elegir "Discos duros" solo aparecen discos duros. El filtro se combina con la búsqueda y la opción "Todas" restablece la lista. El número de resultados mostrado coincide con los elementos de la lista. | Búsqueda o filtro; useState/​useEffect |
| RF‑08 | Detalle de producto | Al pulsar un producto se abre su detalle por identificador, con descripción completa, precio, disponibilidad e imagen. | Cliente, trabajador, administrador | Alta | La ruta /producto/[id] muestra el producto pulsado y no otro. Con un identificador inexistente se muestra "Producto no encontrado" y un botón para volver al catálogo. Si el producto no tiene imagen se muestra una imagen alternativa. | Ruta dinámica; Axios, TanStack Query y mapper |
| RF‑09 | Componentes de presentación reutilizables | Tarjeta de producto, botón y estado de carga, error o vacío como componentes con props tipadas, usados en catálogo, carrito, cotizaciones, bandeja y pedidos. | Cliente, trabajador, administrador | Media | Cada uno de los tres componentes se usa en al menos dos pantallas; al cambiar sus props (texto, variante, mensaje, acción de reintento) cambia la presentación sin duplicar código. | Componentes reutilizables |

3.3 Carrito y compra

| **ID** | **Nombre** | **Descripción** | **Rol o roles** | **Prioridad** | **Criterio de aceptación** | **Tema del curso relacionado** |
| --- | --- | --- | --- | --- | --- | --- |
| RF‑10 | Agregar al carrito y ajustar cantidades | Desde el catálogo o el detalle, el cliente agrega productos y ajusta la cantidad con los botones + y −. | Cliente | Alta | El botón + aumenta de a 1 hasta el inventario disponible; al llegar al límite se deshabilita y se muestra "Solo hay N unidades disponibles". El botón − no baja de 1; para quitar la línea se usa Eliminar. Un producto con inventario 0 aparece como "Agotado" y no se puede agregar. Una cantidad escrita a mano vacía, no numérica, decimal o mayor al inventario se rechaza con mensaje. | Contador contextual |
| RF‑11 | Carrito compartido entre pantallas | El carrito se mantiene al navegar entre catálogo, detalle y carrito, y la pestaña Carrito muestra el número de unidades. | Cliente | Alta | Al agregar un producto desde el detalle, el indicador de la pestaña Carrito se actualiza de inmediato; al volver al catálogo el carrito conserva su contenido; al cerrar y reabrir la app el carrito sigue disponible. | Zustand; conservación de datos |
| RF‑12 | Cálculo del total del pedido | Calcula el subtotal por línea (precio × cantidad), el descuento, los impuestos si aplican, el costo de instalación o mantenimiento si se solicita y el total. | Cliente | Alta | Con dos líneas de cantidades conocidas, el subtotal y el total coinciden con el cálculo manual. Ningún resultado es negativo y el descuento no supera el subtotal. Porcentaje de impuestos, reglas de descuento y tarifas de instalación y mantenimiento: [Por confirmar con el cliente]. | Cálculo contextual; hook propio |
| RF‑13 | Registro de pedido | El cliente confirma la compra y el pedido se registra en el servicio remoto con estado inicial "Pendiente". No se integra una pasarela de pago real. | Cliente | Alta | Al confirmar se muestra el número de pedido y el pedido aparece en Mis pedidos. Si se simula un paso de pago, la pantalla lo identifica como "Pago simulado". Sin conexión o con error del servicio no se muestra confirmación y el carrito se conserva. Si alguna cantidad supera el inventario actual, se indica el producto y las unidades disponibles y no se registra el pedido. | Conservación de datos; Axios |
| RF‑14 | Mis pedidos | Lista los pedidos del cliente con fecha, total y estado, y permite ver su detalle. | Cliente | Media | Al cerrar y reabrir la app, los pedidos registrados siguen apareciendo. Sin pedidos se muestra un estado vacío. Estados del pedido y quién los actualiza: [Por confirmar con el cliente]. | Conservación de datos; TanStack Query |

3.4 Cotizaciones

| **ID** | **Nombre** | **Descripción** | **Rol o roles** | **Prioridad** | **Criterio de aceptación** | **Tema del curso relacionado** |
| --- | --- | --- | --- | --- | --- | --- |
| RF‑15 | Solicitud de cotización | El cliente solicita una cotización indicando el tipo de servicio (instalación o mantenimiento), la descripción de su necesidad y, opcionalmente, productos de interés. | Cliente | Alta | Con datos válidos la solicitud queda en estado "Solicitada" y la ven los trabajadores. Si no se elige el tipo de servicio o la descripción está vacía se muestra un mensaje por campo. Sin conexión no se confirma el envío. | Formulario con validaciones |
| RF‑16 | Elaboración de cotización | El trabajador crea una cotización para un cliente, a partir de una solicitud o directamente, agrega productos del inventario y ajusta sus cantidades. | Trabajador, administrador | Alta | Cada línea toma el producto del inventario con su precio. El contador no permite superar el inventario disponible ni bajar de 1. No se puede guardar sin cliente ni sin al menos una línea. Un producto sin precio registrado para el tipo de cliente no se puede agregar hasta que se registre el precio. Si se reserva inventario mientras la cotización está vigente: [Por confirmar con el cliente]. | Contador contextual; useState/​useEffect |
| RF‑17 | Cálculo de la cotización | Calcula subtotal, descuento, impuestos si aplican, costo de instalación o mantenimiento y total, con la misma lógica del carrito. | Trabajador, administrador | Alta | El total se recalcula al cambiar cualquier cantidad o valor. Un descuento o costo de servicio vacío o no numérico muestra "Ingrese un valor numérico"; los valores negativos se rechazan; un descuento mayor al subtotal se rechaza. Porcentajes y tarifas: [Por confirmar con el cliente]. | Cálculo contextual; hook propio |
| RF‑18 | Envío de cotización | El trabajador envía la cotización; queda guardada en el servicio remoto y llega a la bandeja del cliente. | Trabajador, administrador | Alta | Tras el envío, el cliente la ve en su bandeja desde otro dispositivo y su estado cambia a "Enviada". Sin conexión se informa el fallo, la cotización queda como borrador y no se muestra una confirmación falsa. Vigencia de la cotización y si puede editarse después de enviada: [Por confirmar con el cliente]. | Axios; conservación de datos |
| RF‑19 | Listado de cotizaciones | El trabajador consulta solicitudes y cotizaciones filtrando por estado (Solicitada, Borrador, Enviada, Aceptada, Rechazada) y buscando por cliente. | Trabajador, administrador | Media | Al filtrar por "Enviada" solo aparecen cotizaciones enviadas; la búsqueda por nombre del cliente reduce la lista; sin resultados se muestra un estado vacío. | Búsqueda o filtro; TanStack Query |

3.5 Bandeja de entrada del cliente

| **ID** | **Nombre** | **Descripción** | **Rol o roles** | **Prioridad** | **Criterio de aceptación** | **Tema del curso relacionado** |
| --- | --- | --- | --- | --- | --- | --- |
| RF‑20 | Bandeja de entrada | El cliente ve las cotizaciones recibidas con fecha, total y estado, y distingue las no leídas. | Cliente | Alta | Una cotización nueva aparece al deslizar para recargar o al volver a la pantalla. Carga, error con Reintentar y bandeja vacía tienen su propio mensaje. El cliente solo ve sus propias cotizaciones. | TanStack Query y mapper |
| RF‑21 | Detalle de cotización | Abre la cotización por identificador con sus líneas, cantidades, precios y total. | Cliente, trabajador, administrador | Alta | La ruta /cotizacion/[id] muestra la cotización pulsada. Un identificador inexistente, o una cotización de otro cliente, muestra "Cotización no encontrada". La vista del cliente no incluye costo ni ganancia. | Ruta dinámica |
| RF‑22 | Aceptar o rechazar cotización | El cliente acepta la cotización y la convierte en pedido, o la rechaza. | Cliente | Alta | Al aceptar se crea un pedido con las mismas líneas y el mismo total, la cotización pasa a "Aceptada" y se ofrece agendar la cita. Si algún producto ya no tiene inventario suficiente se informa antes de crear el pedido. Al rechazar pasa a "Rechazada". Una cotización aceptada o rechazada no admite otra acción. Sin conexión el estado no cambia. | Funcionalidad del cliente |

3.6 Ubicación, mapa y citas

| **ID** | **Nombre** | **Descripción** | **Rol o roles** | **Prioridad** | **Criterio de aceptación** | **Tema del curso relacionado** |
| --- | --- | --- | --- | --- | --- | --- |
| RF‑23 | Mapa con la ubicación del negocio | Mapa de OpenStreetMap con Leaflet dentro de una WebView, con el marcador del negocio. | Cliente, trabajador, administrador | Alta | El mapa carga con el marcador en las coordenadas del negocio, que sustituyen las de Dosquebradas del ejercicio de clase. Coordenadas y dirección del negocio: [Por confirmar con el cliente]. Si el mapa no carga (sin conexión o fallo de carga) se muestra un mensaje con Reintentar y el resto de la app sigue funcionando. | Mapa con OpenStreetMap y Leaflet |
| RF‑24 | Ubicación actual del dispositivo | Botón para obtener y centrar la posición actual, con un marcador distinto al del negocio y al de la ubicación de servicio registrada. | Cliente, trabajador | Alta | Con el permiso en primer plano concedido, el mapa se centra en la posición actual. Si el permiso se niega se explica para qué se usa y se ofrece abrir Ajustes; al regresar de Ajustes con el permiso concedido, la función opera sin reiniciar la app. Con el GPS desactivado se muestra "Active la ubicación del dispositivo". En ambos casos el usuario puede seguir usando catálogo, carrito y bandeja. | Ubicación con expo‑location y permisos |
| RF‑25 | Seguimiento de ubicación | Controles para activar, pausar y reanudar el seguimiento de la posición mientras el usuario está en el mapa. | Cliente, trabajador | Media | Al activar, el marcador del dispositivo se actualiza al moverse; al pausar deja de actualizarse; al reanudar continúa. Al salir de la pantalla la suscripción se libera y no queda seguimiento activo. No se usa seguimiento en segundo plano. | Ubicación con expo‑location y permisos; hook propio; useState/​useEffect |
| RF‑26 | Registro de ubicación de servicio | El cliente registra el lugar de instalación o mantenimiento marcando un punto en el mapa o usando su ubicación actual; el trabajador puede registrarla a nombre de un cliente. | Cliente, trabajador, administrador | Alta | Al guardar, la ubicación (coordenadas, dirección y referencia) queda asociada al cliente y aparece en el mapa con su propio marcador. Sin punto seleccionado o con la dirección vacía se muestra un mensaje. Sin conexión no se confirma el registro. | Mapa con OpenStreetMap y Leaflet; formulario con validaciones |
| RF‑27 | Agendar cita | El cliente agenda una cita de instalación o de mantenimiento indicando tipo, fecha, franja horaria, ubicación registrada y pedido asociado, si existe. | Cliente | Alta | Al confirmar, la cita queda "Programada" y aparece en Mis citas y en la lista de los trabajadores. Se rechazan fechas pasadas, campos vacíos y citas sin ubicación. Horarios de atención, duración y cupos por franja: [Por confirmar con el cliente]. | Formulario con validaciones; conservación de datos |
| RF‑28 | Consulta y gestión de citas | El cliente consulta sus citas; el trabajador consulta las citas pendientes y actualiza su estado. | Cliente, trabajador, administrador | Media | Las citas siguen disponibles tras cerrar y reabrir la app. El trabajador cambia el estado (Programada, Realizada, Cancelada) y el cambio se ve en el dispositivo del cliente. Reglas de cancelación y reprogramación: [Por confirmar con el cliente]. | Funcionalidad del cliente |

3.7 Gestión de productos e inventario

| **ID** | **Nombre** | **Descripción** | **Rol o roles** | **Prioridad** | **Criterio de aceptación** | **Tema del curso relacionado** |
| --- | --- | --- | --- | --- | --- | --- |
| RF‑29 | Crear producto | Registra código, nombre, marca, categoría, costo, precio instalador, precio cliente final, inventario e imagen opcional. | Trabajador, administrador | Alta | Con datos válidos el producto aparece en el catálogo. Se rechazan: nombre vacío, código ya existente, costo, precios o inventario vacíos, no numéricos o negativos, e inventario con decimales. Si el código queda vacío se muestra una advertencia; si se permite guardar sin código: [Por confirmar con el cliente]. | Formulario con validaciones |
| RF‑30 | Editar producto, precios e inventario | Modifica los datos de un producto y ajusta su inventario. | Trabajador, administrador | Alta | El formulario abre con los datos actuales del producto y, al guardar, el catálogo muestra los cambios. Aplican las validaciones de RF-29 y el inventario no puede quedar negativo. Si el precio de venta es menor que el costo se muestra una advertencia. Si el trabajador puede ver y editar el costo: [Por confirmar con el cliente]. | useState/​useEffect; formulario con validaciones |
| RF‑31 | Eliminar producto | Elimina un producto previa confirmación. | Trabajador, administrador | Media | Se pide confirmación y, al aceptar, el producto deja de aparecer en el catálogo. Los pedidos y cotizaciones ya registrados conservan sus líneas. Si se bloquea la eliminación de productos incluidos en cotizaciones vigentes, o si se desactiva en lugar de borrar: [Por confirmar con el cliente]. | Funcionalidad del cliente |
| RF‑32 | Carga inicial y depuración del inventario | Se cargan al servicio remoto los productos de las hojas más recientes del Excel (OCTUBRE 26 y HILOOK AGOSTO 26), resolviendo antes sus inconsistencias. | Administrador | Alta | Antes de cargar se obtiene la lista de: productos sin código (por ejemplo, discos duros, fuentes, UPS, video balun y cable UTP); códigos repetidos con distinto costo (por ejemplo, DS‑7208HGHI‑M1(C) y THC‑T120‑PC); productos sin precio instalador; e inventarios finales negativos (hojas FEBRERO 26 y AGOSTO 26). Ningún producto queda cargado con código duplicado ni inventario negativo. Cómo unificar los duplicados y qué código asignar a los productos sin código: [Por confirmar con el cliente]. | Funcionalidad del cliente |

3.8 Gestión de clientes

| **ID** | **Nombre** | **Descripción** | **Rol o roles** | **Prioridad** | **Criterio de aceptación** | **Tema del curso relacionado** |
| --- | --- | --- | --- | --- | --- | --- |
| RF‑33 | Gestión de clientes | El trabajador crea, edita, busca y consulta clientes con nombre, teléfono, correo y ubicaciones de servicio, y ve su historial de cotizaciones, pedidos y citas. | Trabajador, administrador | Media | Un cliente guardado con datos válidos aparece en la lista y puede elegirse al elaborar una cotización. Nombre vacío, correo inválido o teléfono no numérico muestran un mensaje. La búsqueda por nombre o teléfono reduce la lista. El historial muestra solo los registros de ese cliente. Si se distingue entre cliente instalador y cliente final: [Por confirmar con el cliente]. | Formulario con validaciones; búsqueda o filtro |

3.9 Administración

| **ID** | **Nombre** | **Descripción** | **Rol o roles** | **Prioridad** | **Criterio de aceptación** | **Tema del curso relacionado** |
| --- | --- | --- | --- | --- | --- | --- |
| RF‑34 | Gestión de usuarios y roles | El administrador crea, edita y desactiva usuarios, y les asigna el rol de cliente, trabajador o administrador. | Administrador | Alta | Un usuario desactivado no puede iniciar sesión. Se valida que el correo sea único y que los campos obligatorios no estén vacíos. Tras un cambio de rol, el usuario ve solo las opciones del nuevo rol al iniciar sesión. Un cliente o trabajador no puede abrir esta pantalla, ni escribiendo la ruta. Siempre debe quedar al menos un administrador activo. | Formulario con validaciones; navegación Stack, Tabs o Drawer |
| RF‑35 | Consulta de ventas y ganancias | El administrador consulta las ventas a instalador y a cliente final y la ganancia por producto y periodo, equivalentes a las columnas del Excel. | Administrador | Media | La ganancia mostrada coincide con (precio de venta − costo) × unidades vendidas. Un periodo sin ventas muestra cero, no un error. El cliente nunca accede a esta información. Si el trabajador tiene acceso: [Por confirmar con el cliente]. | Cálculo contextual |

4. Requerimientos no funcionales

| **ID** | **Categoría** | **Descripción** | **Criterio de verificación** |
| --- | --- | --- | --- |
| RNF‑01 | Usabilidad | Las funciones del proceso principal son accesibles desde la navegación con títulos e íconos comprensibles; los textos son legibles y los formularios no quedan ocultos por el teclado. | En un teléfono Android, un usuario completa solicitud, aceptación de cotización y agendamiento de cita sin ayuda; ningún campo queda tapado por el teclado y se respetan las áreas seguras. |
| RNF‑02 | Usabilidad | Toda pantalla con datos remotos muestra estados de carga, vacío y error con opción de reintentar; los productos sin imagen muestran una imagen alternativa. La interfaz usa NativeWind con colores coherentes y al menos una fuente personalizada. | Se fuerza cada estado (servicio detenido, lista vacía, producto sin imagen) y se comprueba que aparece el mensaje o recurso correspondiente. |
| RNF‑03 | Rendimiento | El catálogo usa listas virtualizadas y la búsqueda y los filtros se aplican sobre los datos ya cargados, sin una petición por cada tecla. TanStack Query define un tiempo de caché para catálogo, cotizaciones y pedidos. | Con el inventario completo cargado, el desplazamiento no se bloquea y al volver a una pantalla ya visitada los datos aparecen desde caché. Tiempos objetivo de carga: [Por confirmar con el cliente]. |
| RNF‑04 | Compatibilidad | La app funciona en Android con Expo, usando la base y las versiones compatibles trabajadas en clase; se entregan package.json y el archivo de bloqueo. | La app se instala desde cero con las instrucciones del README y se ejecuta en un teléfono Android real sin errores. |
| RNF‑05 | Seguridad y control de acceso por rol | Cada pantalla y operación verifica el rol del usuario; el servicio remoto rechaza operaciones no permitidas aunque se intenten fuera de la interfaz. | Con una cuenta de cliente, abrir por ruta directa una pantalla de trabajador o administrador redirige o muestra "Acceso no autorizado"; una petición de modificación de productos con token de cliente es rechazada. |
| RNF‑06 | Confidencialidad de costo y ganancias | El costo y las ganancias nunca llegan a la vista del cliente: el servicio no los envía en respuestas para ese rol y el modelo interno del cliente no los incluye. | Se revisan las respuestas HTTP y las pantallas con una cuenta de cliente: no aparecen los campos de costo ni de ganancia. Visibilidad del costo para el trabajador: [Por confirmar con el cliente]. |
| RNF‑07 | Manejo de credenciales | La configuración externa se documenta en .env.template; el archivo .env no se sube al repositorio y no se guardan secretos en variables EXPO_PUBLIC, porque se incorporan al cliente. | El repositorio contiene .env.template y no contiene .env, node_modules ni claves privadas; las variables EXPO_PUBLIC solo contienen valores públicos como la URL base del servicio. |
| RNF‑08 | Funcionamiento sin conexión | La app detecta la falta de conexión, lo informa y no muestra confirmaciones falsas de envío o registro; recupera el uso normal cuando vuelve la conexión. | Con el modo avión activo, intentar enviar una cotización, registrar un pedido o agendar una cita muestra un mensaje de error y no crea registros; al restablecer la conexión, la misma acción se completa con Reintentar. |
| RNF‑09 | Persistencia | Pedidos, cotizaciones, citas y ubicaciones se conservan y pueden consultarse después de cerrar y volver a abrir la app; la sesión y el carrito se conservan localmente. | Se registra un pedido, se cierra la app por completo, se vuelve a abrir y el pedido sigue en Mis pedidos; la sesión y el carrito siguen disponibles. |
| RNF‑10 | Datos compartidos entre dispositivos | La información que intercambian trabajador y cliente se guarda en un servicio remoto compartido, no solo en el teléfono. Servicio a utilizar: [Por definir por el equipo]. | Una cotización enviada desde el dispositivo del trabajador aparece en la bandeja del cliente en otro dispositivo; la aceptación del cliente se ve en el dispositivo del trabajador. |
| RNF‑11 | Mantenibilidad: organización del código | El código separa rutas de Expo Router, pantallas, componentes, hooks, servicios HTTP, tipos e interfaces, modelos, mappers y estado global; la baseURL y la configuración HTTP están centralizadas en un servicio. | La revisión del repositorio muestra la estructura por carpetas y una única configuración de Axios; ningún archivo concentra la aplicación completa. |
| RNF‑12 | Mantenibilidad: tipado | Las entidades, props, respuestas de API y resultados de funciones tienen tipos definidos; no se usa any como solución general. | La verificación de tipos de TypeScript termina sin errores y la búsqueda de "any" en el código no arroja usos injustificados. |
| RNF‑13 | Privacidad de la ubicación | Se pide solo el permiso de ubicación en primer plano y solo al usar el mapa; la ubicación de servicio de un cliente solo la ven ese cliente, los trabajadores y el administrador. Tiempo de conservación de las ubicaciones: [Por confirmar con el cliente]. | El permiso no se solicita al abrir la app sino al usar la función; con otra cuenta de cliente no es posible ver la ubicación registrada por el primero. |
| RNF‑14 | Liberación de suscripciones | El seguimiento de ubicación se detiene al pausar o al salir de la pantalla del mapa, y los efectos limpian sus suscripciones. | Tras salir del mapa, el indicador de ubicación del sistema desaparece y no llegan nuevas actualizaciones de posición; el código de los efectos incluye la función de limpieza. |
| RNF‑15 | Integridad de los datos del inventario | El inventario no puede quedar negativo, cada código de producto es único, precios e inventario son numéricos y no negativos, y la venta de un producto descuenta inventario de forma consistente aunque dos usuarios compren a la vez. | Intentar guardar un código repetido, un precio vacío o un inventario negativo es rechazado; dos pedidos simultáneos por la última unidad registran solo uno; la carga inicial del Excel no deja duplicados ni negativos (RF-32). |

5. Reglas de negocio

La cantidad de cada producto en el carrito o en una cotización es un número entero entre 1 y las unidades disponibles. No se aceptan valores vacíos, negativos, decimales ni texto, y un producto agotado no se puede agregar (RF‑10, RF‑16). El inventario tampoco puede quedar negativo después de una venta o de un ajuste manual, como sí ocurrió en dos hojas del Excel (RNF‑15). Por eso la disponibilidad se vuelve a comprobar al confirmar un pedido o al aceptar una cotización: entre un momento y otro, otro usuario pudo comprar las mismas unidades.

El total se calcula con la misma lógica en el carrito y en la cotización (RF‑12, RF‑17). El subtotal de cada línea es el precio por la cantidad, y la suma de las líneas da el subtotal general. A ese valor se le resta el descuento, que no puede ser negativo ni mayor que el subtotal; luego se suman los impuestos, si aplican, y el costo de instalación o mantenimiento cuando el cliente pide el servicio. Ni el total ni los valores intermedios pueden ser negativos. El porcentaje de impuestos, sobre qué valores se aplica, las reglas de descuento y las tarifas de instalación y mantenimiento están [Por confirmar con el cliente].

Cada producto tiene un precio para instalador y otro para cliente final, pero aún no está definido qué precio ve cada rol ni cómo se identifica a un cliente instalador: [Por confirmar con el cliente]. En cambio, sí está decidido que el costo y las ganancias nunca se muestran al cliente, como se detalla en RNF‑06. Si el trabajador puede verlos también está [Por confirmar con el cliente].

En cuanto a los productos, cada código es único y el costo, los precios y el inventario son valores numéricos no negativos (RF‑29). Los productos que en el Excel no tienen código o lo tienen repetido se depuran antes de la carga inicial, según RF‑32.

Desde el punto de vista del cliente, una cotización pasa por cinco estados. Es Nueva cuando el trabajador la envía y el cliente todavía no la ha abierto, y pasa a Vista cuando abre su detalle. Desde cualquiera de esos dos estados el cliente puede aceptarla, lo que crea el pedido, o rechazarla. Si se cumple su vigencia sin respuesta, queda Vencida y ya no se puede aceptar. Aceptada, Rechazada y Vencida son estados finales. Del lado del trabajador, la solicitud aparece como Solicitada y la cotización en preparación como Borrador (RF‑15, RF‑18); el estado Enviada que usa RF‑19 equivale a Nueva o Vista en la bandeja del cliente. Los días de vigencia de una cotización están [Por confirmar con el cliente].

Toda compra, ya sea desde el carrito o desde una cotización aceptada, se registra como un pedido con estado inicial Pendiente (RF‑13). No integramos una pasarela de pago real; si en la demostración aparece un paso de pago, la pantalla lo identifica como pago simulado. El pedido solo se confirma cuando el servicio remoto responde que lo guardó.

Una cita se puede agendar cuando el cliente tiene al menos una ubicación de servicio registrada y elige una fecha futura con su franja horaria (RF‑26, RF‑27). Puede ser de instalación, asociada al pedido correspondiente, o de mantenimiento, que no exige una compra previa. Se crea como Programada y el trabajador la cambia a Realizada o Cancelada (RF‑28). Los horarios de atención, la duración de cada visita, los cupos por franja y las reglas de cancelación están [Por confirmar con el cliente].

6. Mapa de pantallas

La navegación combina los tres tipos que piden los lineamientos. Al abrir la app, una pantalla de inicio revisa si hay una sesión guardada y lleva al usuario a iniciar sesión o directamente a las pestañas de su rol. Las pestañas (Tabs) reúnen las secciones que cada rol usa con más frecuencia, mientras que el menú lateral (Drawer) agrupa los accesos complementarios, como pedidos, citas, ubicaciones y perfil. Los flujos que avanzan paso a paso y necesitan regresar, por ejemplo abrir un producto, crear una cotización o agendar una cita, se abren en Stack encima de la pestaña actual, de modo que el botón atrás devuelve al punto de partida.

Tenemos dos rutas dinámicas por identificador: /producto/[id] abre el detalle del producto pulsado (RF‑08) y /cotizacion/[id] abre el detalle de una cotización (RF‑21). Ambas muestran un mensaje cuando el identificador no existe. El administrador usa todas las pantallas del trabajador, así que en la tabla solo aparecen las dos que son exclusivas de su rol.

| **Pantalla** | **Rol** | **Navegación** | **Propósito** |
| --- | --- | --- | --- |
| Inicio de la app | Todos | Stack | Revisa la sesión guardada y dirige a iniciar sesión o a las pestañas del rol (RF‑04). |
| Iniciar sesión | Todos | Stack | Ingreso con correo y contraseña e identificación del rol (RF‑01). |
| Registro | Cliente | Stack | Creación de la cuenta de cliente (RF‑02). |
| Inicio | Cliente | Tabs | Resumen con las cotizaciones nuevas, la próxima cita y accesos rápidos al catálogo y a solicitar cotización. |
| Catálogo | Cliente | Tabs | Lista de productos con búsqueda y filtro por categoría y marca (RF‑05 a RF‑07). |
| Cotizaciones | Cliente | Tabs | Bandeja de entrada con las cotizaciones recibidas y su estado (RF‑20). |
| Carrito | Cliente | Tabs | Ajuste de cantidades, cálculo del total y confirmación de la compra (RF‑10 a RF‑13). |
| Mis pedidos | Cliente | Drawer | Historial de pedidos con fecha, total y estado (RF‑14). |
| Mis citas | Cliente | Drawer | Citas agendadas y su estado (RF‑28). |
| Mis ubicaciones | Cliente | Drawer | Ubicaciones de servicio registradas y acceso al mapa (RF‑26). |
| Perfil | Todos | Drawer | Consulta y edición de los datos de la cuenta. |
| Cerrar sesión | Todos | Drawer | Termina la sesión y borra los datos locales del usuario (RF‑04). |
| Detalle de producto | Todos | Stack | Ruta /producto/[id] con descripción, precio, disponibilidad e imagen; el cliente puede agregarlo al carrito (RF‑08). |
| Solicitar cotización | Cliente | Stack | Formulario con el tipo de servicio, la necesidad y los productos de interés (RF‑15). |
| Detalle de cotización | Todos | Stack | Ruta /cotizacion/[id] con líneas y totales; el cliente la acepta o la rechaza (RF‑21, RF‑22). |
| Mapa | Cliente, trabajador | Stack | Ubicación del negocio, posición actual, seguimiento y selección del punto de servicio (RF‑23 a RF‑26). |
| Agendar cita | Cliente | Stack | Formulario con tipo de servicio, fecha, franja horaria y ubicación (RF‑27). |
| Confirmación de pedido | Cliente | Stack | Número del pedido registrado y opción de agendar la cita (RF‑13, RF‑22). |
| Productos | Trabajador, administrador | Tabs | Lista de productos con inventario y acceso a crear, editar o eliminar (RF‑29 a RF‑31). |
| Cotizaciones | Trabajador, administrador | Tabs | Solicitudes y cotizaciones filtradas por estado y por cliente (RF‑19). |
| Clientes | Trabajador, administrador | Tabs | Lista y búsqueda de clientes (RF‑33). |
| Citas | Trabajador, administrador | Tabs | Citas pendientes y cambio de estado (RF‑28). |
| Ubicaciones | Trabajador, administrador | Drawer | Ubicaciones de servicio de los clientes y acceso al mapa (RF‑26). |
| Formulario de producto | Trabajador, administrador | Stack | Creación o edición de producto, precios e inventario (RF‑29, RF‑30). |
| Detalle de cliente | Trabajador, administrador | Stack | Datos, ubicaciones e historial de cotizaciones, pedidos y citas del cliente (RF‑33). |
| Formulario de cliente | Trabajador, administrador | Stack | Creación o edición de un cliente (RF‑33). |
| Crear cotización | Trabajador, administrador | Stack | Selección de cliente y productos, ajuste de cantidades, cálculo y envío (RF‑16 a RF‑18). |
| Registrar ubicación | Trabajador, administrador | Stack | Registro de una ubicación de servicio a nombre de un cliente (RF‑26). |
| Panel general | Administrador | Tabs | Ventas y ganancias por producto y periodo (RF‑35). |
| Usuarios y roles | Administrador | Drawer | Creación, edición y desactivación de usuarios y asignación de rol (RF‑34). |

7. Organización del código

Proponemos la siguiente estructura basada en Expo Router. La carpeta app contiene solo las rutas y las pantallas, y el resto del código está en src, separado por responsabilidad. En el árbol omitimos la extensión de la mayoría de los archivos. La actualizaremos cuando tengamos la versión final del código.

app/
    _layout.tsx · index.tsx
    (auth)/ login · registro
    (cliente)/ _layout (Drawer) · mis-pedidos · mis-citas · mis-ubicaciones · perfil
        (tabs)/ inicio · catalogo · cotizaciones · carrito
        flujos/ solicitar-cotizacion · mapa · agendar-cita · confirmacion-pedido
    (trabajador)/ _layout (Drawer) · ubicaciones · perfil
        (tabs)/ productos · cotizaciones · clientes · citas
        flujos/ producto-form · cliente-form · cliente/[id] · cotizacion-form · ubicacion-form
    (admin)/ panel · usuarios
    producto/[id].tsx · cotizacion/[id].tsx
src/
    components/ TarjetaProducto · Boton · EstadoVista · ContadorCantidad · MapaLeaflet
    hooks/ useProductos · useCotizaciones · useCalculoTotal · useUbicacion
    services/ api · auth · productos · cotizaciones · pedidos · citas
    types/ api.types · props.types
    models/ Producto · Cotizacion · Pedido · Cita · Ubicacion · Usuario
    mappers/ producto.mapper · cotizacion.mapper
    store/ sesionStore · carritoStore · mapaStore
    utils/ calculos · validaciones
assets/ fonts/ · images/ · mapa/leaflet.html
.env.template · package.json · package-lock.json

En app, cada archivo es una pantalla y cada _layout.tsx define la navegación de su grupo: el layout raíz es el Stack, el de cada rol monta el Drawer y el de (tabs) las pestañas. Los grupos entre paréntesis ordenan las pantallas por rol sin cambiar la ruta, y producto/[id].tsx y cotizacion/[id].tsx son las rutas dinámicas descritas en la sección 6. En src/components están los componentes reutilizables con props tipadas, y en src/hooks la lógica que usan varias pantallas: las consultas con TanStack Query, el cálculo del total y el seguimiento de ubicación.

La comunicación con el servicio remoto vive en src/services. Allí, api.ts crea la instancia de Axios con la baseURL leída de una variable de entorno, y cada archivo agrupa las peticiones de un recurso. Las respuestas del servicio se describen en src/types, mientras que src/models define las entidades con las que trabaja la app; los archivos de src/mappers convierten unas en otras y, por ejemplo, dejan fuera el costo cuando el usuario es cliente. Por último, src/store guarda los stores de Zustand (sesión, carrito y mapa), src/utils las funciones de cálculo y validación, y assets las fuentes, las imágenes y el HTML de Leaflet que carga la WebView.

8. Matriz de requisitos

La matriz relaciona cada requisito obligatorio de los lineamientos con la función de nuestra app que lo cumple, la pantalla donde se ve, el archivo donde se implementa y los requerimientos de las secciones 3 y 4 que lo describen. Los archivos corresponden a la estructura de la sección 7, y la evidencia se completará a medida que demostremos cada función en clase.

| **Requisito** | **Función en la app** | **Pantalla** | **Archivo propuesto** | **RF / RNF** | **Evidencia** |
| --- | --- | --- | --- | --- | --- |
| React Native, TypeScript y Expo | Proyecto ejecutable en Android con dependencias fijadas | Todas | package.json, package-lock.json | RNF‑04 | [Pendiente] |
| Organización del código | Rutas, pantallas, componentes, hooks, servicios, tipos y modelos separados | Todas | app/​, src/​ | RNF‑11 | [Pendiente] |
| Tipos sin any | Tipos para entidades, props, respuestas y resultados | Todas | src/​types/​, src/​models/​ | RNF‑12 | [Pendiente] |
| Navegación Stack | Flujos de detalle, cotización y cita con retroceso | Detalle de producto, Crear cotización, Agendar cita | app/​_layout.tsx | RF‑03 | [Pendiente] |
| Navegación Tabs | Secciones frecuentes de cada rol | Pestañas de cliente y trabajador | app/​(cliente)/​(tabs)/​_layout.tsx | RF‑03 | [Pendiente] |
| Navegación Drawer | Accesos complementarios | Mis pedidos, Mis citas, Perfil | app/​(cliente)/​_layout.tsx | RF‑03 | [Pendiente] |
| Ruta dinámica | Detalle de producto y de cotización por identificador | Detalle de producto, Detalle de cotización | app/​producto/​[id].tsx, app/​cotizacion/​[id].tsx | RF‑08, RF‑21 | [Pendiente] |
| NativeWind, fuente personalizada y áreas seguras | Estilos coherentes, estados de carga e imagen alternativa | Todas | tailwind.config.js, assets/​fonts/​ | RNF‑01, RNF‑02 | [Pendiente] |
| Componentes reutilizables | Tarjeta de producto, botón y estado de carga, error o vacío | Catálogo, Carrito, Cotizaciones | src/​components/​ | RF‑09 | [Pendiente] |
| Búsqueda o filtro | Búsqueda y filtro del catálogo; filtro de cotizaciones | Catálogo, Cotizaciones | app/​(cliente)/​(tabs)/​catalogo.tsx | RF‑06, RF‑07, RF‑19 | [Pendiente] |
| useState y useEffect | Filtros, formularios y seguimiento de ubicación | Catálogo, Crear cotización, Mapa | catalogo.tsx, src/​hooks/​useUbicacion.ts | RF‑07, RF‑16, RF‑25 | [Pendiente] |
| Hook propio | Cálculo del total y seguimiento de ubicación | Carrito, Crear cotización, Mapa | src/​hooks/​useCalculoTotal.ts, src/​hooks/​useUbicacion.ts | RF‑12, RF‑17, RF‑25 | [Pendiente] |
| Zustand | Sesión, carrito y estado del mapa compartidos entre pantallas | Carrito, Mapa | src/​store/​ | RF‑04, RF‑11 | [Pendiente] |
| Contador contextual | Cantidades limitadas por el inventario | Carrito, Crear cotización | src/​components/​ContadorCantidad.tsx | RF‑10, RF‑16 | [Pendiente] |
| Cálculo contextual | Subtotal, descuento, impuestos y costo del servicio | Carrito, Crear cotización | src/​utils/​calculos.ts | RF‑12, RF‑17 | [Pendiente] |
| Formulario con validaciones | Inicio de sesión, solicitud de cotización, producto, cliente y cita | Iniciar sesión, Solicitar cotización, Formulario de producto, Agendar cita | src/​utils/​validaciones.ts | RF‑01, RF‑15, RF‑27, RF‑29 | [Pendiente] |
| Axios con configuración centralizada | Instancia única con baseURL | Todas las que usan datos remotos | src/​services/​api.ts | RF‑05, RNF‑11 | [Pendiente] |
| Consulta de listado y de detalle | Catálogo y detalle de producto | Catálogo, Detalle de producto | src/​services/​productos.service.ts | RF‑05, RF‑08 | [Pendiente] |
| Interfaces, modelos y mapper | Adaptación de la respuesta del servicio al modelo interno | Catálogo, Cotizaciones | src/​types/​api.types.ts, src/​mappers/​ | RF‑05, RF‑20, RNF‑06 | [Pendiente] |
| TanStack Query | Consultas con queryKey, caché, estados y reintento | Catálogo, Cotizaciones | src/​hooks/​useProductos.ts, src/​hooks/​useCotizaciones.ts | RF‑05, RF‑20, RNF‑03 | [Pendiente] |
| Conservación de datos | Pedidos, cotizaciones y citas en el servicio remoto | Mis pedidos, Mis citas, Cotizaciones | src/​services/​ | RNF‑09, RNF‑10 | [Pendiente] |
| Mapa con OpenStreetMap y Leaflet | Ubicación del negocio y del servicio en una WebView | Mapa | src/​components/​MapaLeaflet.tsx, assets/​mapa/​leaflet.html | RF‑23, RF‑26 | [Pendiente] |
| Ubicación con expo‑location y permisos | Posición actual, permiso denegado, regreso de Ajustes y GPS apagado | Mapa | src/​hooks/​useUbicacion.ts | RF‑24, RNF‑13 | [Pendiente] |
| Seguimiento y liberación de suscripciones | Activar, pausar y reanudar; detener al salir | Mapa | src/​hooks/​useUbicacion.ts | RF‑25, RNF‑14 | [Pendiente] |
| Uso sin conexión | Avisos sin confirmaciones falsas y reintento | Todas las que usan datos remotos | src/​services/​api.ts | RNF‑08 | [Pendiente] |
| Configuración y credenciales | Plantilla de variables sin secretos | No aplica | .env.template | RNF‑07 | [Pendiente] |

9. Conservación de la información

La app maneja dos tipos de información. Los productos, los clientes, las cotizaciones, los pedidos, las citas y las ubicaciones de servicio son datos del negocio y deben conservarse aunque el usuario cierre la app o cambie de teléfono. La sesión y el carrito, en cambio, pertenecen a cada dispositivo y basta con guardarlos localmente (RNF‑09).

Guardar los datos del negocio solo en el teléfono no funcionaría, porque el proceso principal involucra a dos personas en dispositivos distintos. El trabajador crea la cotización en su teléfono y el cliente la recibe en el suyo; cuando el cliente la acepta, ese cambio tiene que verse del lado del trabajador (RNF‑10). Lo mismo ocurre con el inventario: si cada teléfono tuviera su propia copia, dos clientes podrían comprar la misma unidad. Por eso guardamos estos datos en un servicio remoto compartido, [Servicio por definir], al que la app accede por HTTP con Axios.

Este almacenamiento no cumple la misma función que Zustand ni que la caché de TanStack Query. Zustand comparte datos entre pantallas mientras la app está abierta, como el carrito o el estado del seguimiento en el mapa, y solo conserva la sesión y el carrito porque los persistimos en el almacenamiento local del dispositivo (por ejemplo, AsyncStorage). La caché de TanStack Query guarda por un tiempo las respuestas del servicio para no repetir peticiones y mostrar datos mientras se recargan, pero se descarta y no reemplaza al servicio. La fuente de verdad de los datos del negocio es siempre el servicio remoto.

Documentaremos los límites exactos cuando elijamos el servicio. Desde ya sabemos que cualquier cambio requiere conexión, que la cuota de uso dependerá del plan disponible y que un cambio hecho en un dispositivo se verá en el otro al recargar la pantalla, no en tiempo real (RF‑20).

10. Pruebas y evidencias

Probaremos la app en un teléfono Android real con Expo, usando una cuenta de cada rol y el inventario cargado desde las hojas OCTUBRE 26 y HILOOK AGOSTO 26 (RF‑32). Para el proceso principal usaremos dos dispositivos, uno con la cuenta del trabajador y otro con la del cliente. Cada caso quedará respaldado con una captura o un video corto en la columna de evidencia.

| **ID** | **Caso** | **Pasos** | **Resultado esperado** | **Resultado obtenido** | **Evidencia** |
| --- | --- | --- | --- | --- | --- |
| CP‑01 | Proceso principal completo | El cliente solicita una cotización de instalación. El trabajador la elabora con dos productos y la envía. El cliente la abre, la acepta, registra su ubicación y agenda la cita. | La cotización llega como Nueva, pasa a Vista y luego a Aceptada; se crea un pedido con el mismo total y la cita queda Programada y visible para el trabajador (RF‑15 a RF‑22, RF‑26, RF‑27). | [Pendiente] | [Pendiente] |
| CP‑02 | Permiso de ubicación denegado | Abrir el mapa, negar el permiso y pulsar el botón de ubicación actual. | Aparece un mensaje que explica para qué se usa la ubicación y un botón para abrir Ajustes; catálogo, carrito y bandeja siguen funcionando (RF‑24). | [Pendiente] | [Pendiente] |
| CP‑03 | Regreso desde Ajustes | Con el permiso negado, abrir Ajustes desde la app, concederlo y volver. | La app reconoce el permiso al volver y centra el mapa sin reiniciarse (RF‑24). | [Pendiente] | [Pendiente] |
| CP‑04 | GPS desactivado | Apagar la ubicación del teléfono y pulsar el botón de ubicación actual. | Se muestra "Active la ubicación del dispositivo" y la pantalla no queda cargando (RF‑24). | [Pendiente] | [Pendiente] |
| CP‑05 | Seguimiento y liberación | Activar el seguimiento, pausarlo, reanudarlo y salir del mapa. | El marcador se mueve solo mientras el seguimiento está activo; al salir desaparece el indicador de ubicación del sistema (RF‑25, RNF‑14). | [Pendiente] | [Pendiente] |
| CP‑06 | Sin conexión | Con el modo avión activo, enviar una cotización, confirmar un pedido y agendar una cita; después reconectar y pulsar Reintentar. | Cada acción muestra un error y no crea registros; con conexión, el reintento completa la acción (RNF‑08). | [Pendiente] | [Pendiente] |
| CP‑07 | Cantidad mayor al inventario | Agregar al carrito el DVR DS‑7204HGHI‑M1(C), que tiene 2 unidades en la hoja OCTUBRE 26, pulsar + tres veces y luego escribir 5 a mano. | El contador se detiene en 2, aparece "Solo hay 2 unidades disponibles" y la cantidad escrita se rechaza (RF‑10). | [Pendiente] | [Pendiente] |
| CP‑08 | Campos vacíos o no numéricos | En el formulario de producto dejar el nombre vacío y escribir "abc" en el precio; en una cotización escribir texto en el descuento. | Cada campo muestra su mensaje y no se guarda nada (RF‑17, RF‑29). | [Pendiente] | [Pendiente] |
| CP‑09 | Identificador inexistente | Abrir /producto/[id] y /cotizacion/[id] con identificadores que no existen. | Se muestran "Producto no encontrado" y "Cotización no encontrada" con opción de volver (RF‑08, RF‑21). | [Pendiente] | [Pendiente] |
| CP‑10 | Datos conservados | Registrar un pedido y una cita, cerrar la app por completo y volver a abrirla. | La sesión sigue activa y el pedido y la cita aparecen en Mis pedidos y Mis citas (RNF‑09). | [Pendiente] | [Pendiente] |
| CP‑11 | Cliente sin acceso a costos | Con una cuenta de cliente revisar catálogo, detalle de producto, detalle de cotización y las respuestas HTTP. | No aparecen el costo ni las ganancias en pantallas ni en respuestas (RNF‑06). | [Pendiente] | [Pendiente] |
| CP‑12 | Acceso por rol | Con una cuenta de cliente intentar abrir la pantalla de usuarios y roles escribiendo la ruta. | La app muestra "Acceso no autorizado" o redirige al inicio del cliente (RF‑34, RNF‑05). | [Pendiente] | [Pendiente] |

11. Prueba con el cliente y retroalimentación

Haremos la prueba con una persona de la empresa que cumpla el papel de trabajador y con un cliente final representativo. En este documento los identificaremos solo por su rol, sin nombres, teléfonos, correos ni direcciones, y la ubicación usada en la prueba no se publicará.

Al trabajador le pediremos que elabore y envíe una cotización con productos del inventario real; al cliente, que la reciba, la acepte, registre su ubicación y agende la instalación. No les explicaremos antes cómo usar la app. Mientras trabajan observaremos si completan cada paso sin ayuda, en qué pantallas dudan o se equivocan, cuánto tardan y si los totales y los estados coinciden con lo esperado. Al final les preguntaremos qué les costó más y qué cambiarían.

Fecha de la prueba: [Pendiente]

Participantes (por rol): [Pendiente]

Resultado: [Pendiente]

Dificultades encontradas: [Pendiente]

Ajuste realizado a partir de la retroalimentación: [Pendiente]

12. Límites conocidos

En esta versión la app registra las compras como pedidos, pero no cobra: no hay pago en línea real y cualquier paso de pago que se muestre es simulado (sección 5). El seguimiento de ubicación solo funciona mientras el usuario tiene abierto el mapa, así que no rastreamos a nadie en segundo plano. Tampoco calculamos rutas, distancias por vía ni navegación giro a giro, y el mapa no traza líneas entre puntos que puedan confundirse con un recorrido real.

Hay funciones que dependen de decisiones pendientes del cliente: el porcentaje de impuestos y las tarifas de servicio, la vigencia de las cotizaciones, qué precio ve cada rol, si el trabajador ve el costo, si se reserva inventario durante una cotización, los horarios y cupos de las citas y la forma de unificar los códigos repetidos del Excel. Mientras no estén definidas, trabajaremos con valores de prueba identificados como tales, y la carga inicial del inventario quedará sujeta a esa depuración (RF‑32).

Además, la app no envía notificaciones: el cliente ve una cotización nueva al abrir o recargar la bandeja. Los cambios exigen conexión, como se explica en la sección 9, y solo la probaremos en Android, sin publicarla en una tienda.

13. Bitácora de avances

En esta tabla registramos cada revisión de clase. Partimos de una fila por hito de los lineamientos; si un hito ocupa varias clases, agregaremos una fila por revisión con su fecha y su commit.

| **Fecha** | **Objetivo de la clase** | **Tarea realizada** | **Respon­sable** | **Eviden­cia o ****commit** | **Dificultad encon­trada** | **Observa­ción del docente** | **Siguiente paso** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [Pendiente] | Hito 1. Definición y base: cliente y problema, alcance, matriz inicial, mapa de pantallas, proyecto ejecutable y primeras rutas. | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] |
| [Pendiente] | Hito 2. Interfaz y lógica: Stack, Tabs y Drawer conectados; componentes, props, contador, cálculo, formulario y estado compartido. | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] |
| [Pendiente] | Hito 3. Datos y ubicación: consultas HTTP, tipos, mapper, hooks y TanStack Query; mapa, GPS y tratamiento de permisos. | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] |
| [Pendiente] | Hito 4. Integración y ajustes: proceso completo, conservación de datos, pruebas de fallos, retroali­mentación y correcciones. | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] | [Pendiente] |