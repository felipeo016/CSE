import type { ComponentProps, ReactNode, Ref } from 'react';
import type { KeyboardTypeOptions } from 'react-native';
import type { Feather } from '@expo/vector-icons';

import type { ResultadoCalculoTotal } from '../hooks/useCalculoTotal';
import type { LineaCarrito, ServicioCarrito } from '../models/Carrito';
import type { Cita, EstadoCita, EstadoFinalCita } from '../models/Cita';
import type { Cliente } from '../models/Cliente';
import type { Coordenadas } from '../config/valoresPrueba';
import type {
  Cotizacion,
  CotizacionGuardada,
  CotizacionSegunRol,
  EstadoCotizacion,
  LineaCotizacion,
  SolicitudCreada,
  TipoServicio,
} from '../models/Cotizacion';
import type {
  ClienteElegido,
  LineaVista,
  ValoresInicialesCotizacion,
} from '../models/FormularioCotizacion';
import type { EstadoSeguimiento, PuntoMapa } from '../models/Mapa';
import type { LineaPedido, Pedido } from '../models/Pedido';
import type { ProductoPersonal, ProductoSegunRol, TipoCliente } from '../models/Producto';
import type { Ubicacion } from '../models/Ubicacion';
import type { Rol, Usuario, UsuarioAdmin } from '../models/Usuario';
import type { TotalesVentas, VentaProducto } from '../models/Ventas';

/** Nombre de un ícono del set Feather (@expo/vector-icons), el estilo de íconos del mockup. */
export type NombreIcono = ComponentProps<typeof Feather>['name'];

/** Variantes visuales del botón: azul relleno, borde azul o borde rojo (acciones destructivas). */
export type VarianteBoton = 'primario' | 'secundario' | 'peligro';

export interface BotonProps {
  /** Texto visible del botón. */
  texto: string;
  /** Acción al pulsar. No se ejecuta si el botón está deshabilitado o cargando. */
  onPress: () => void;
  /** Por defecto 'primario'. */
  variante?: VarianteBoton;
  deshabilitado?: boolean;
  /** Muestra un indicador de carga y bloquea el botón (evita el doble envío). */
  cargando?: boolean;
  /** Ícono opcional a la izquierda del texto. */
  icono?: NombreIcono;
}

/** Los tres estados que muestra una pantalla con datos remotos (RNF-02). */
export type TipoEstadoVista = 'carga' | 'error' | 'vacio';

/** Acción opcional de EstadoVista: Reintentar, Limpiar búsqueda, Volver... */
export interface AccionEstadoVista {
  texto: string;
  onPress: () => void;
}

export interface EstadoVistaProps {
  tipo: TipoEstadoVista;
  /** Mensaje principal, por ejemplo "No se pudo cargar el catálogo". */
  mensaje: string;
  /** Texto de ayuda opcional bajo el mensaje. */
  detalle?: string;
  accion?: AccionEstadoVista;
}

export interface CampoTextoProps {
  etiqueta: string;
  valor: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
  /** Mensaje de error que se muestra bajo el campo; null o undefined si el campo es válido. */
  error?: string | null;
  /** Tipo de teclado: 'default', 'email-address', 'phone-pad', 'numeric'... */
  tipoTeclado?: KeyboardTypeOptions;
  /** Oculta el texto y muestra el botón del ojo para verlo. */
  esContrasena?: boolean;
  /** Ícono a la izquierda del texto. */
  icono?: NombreIcono;
  /** Por defecto 'sentences'; en correo y contraseña se usa 'none'. */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /**
   * true: la etiqueta va dentro del recuadro, en letra pequeña sobre el valor (mockup de Registro).
   * false (por defecto): la etiqueta va encima del recuadro (mockup de Iniciar sesión).
   */
  etiquetaDentro?: boolean;
  /** true: campo de varias líneas (por ejemplo, la descripción de una solicitud). */
  multilinea?: boolean;
}

/** Pantalla que pertenece a un prompt futuro: título y aviso "En construcción — [ID]". */
export interface PantallaEnConstruccionProps {
  titulo: string;
  /** ID del prompt que completará la pantalla, por ejemplo 'J3'. */
  prompt: string;
  /**
   * true en las pantallas Stack, donde el título ya aparece en el encabezado junto a la flecha
   * atrás; así no se repite. Por defecto false (el título grande va dentro de la pantalla).
   */
  tituloEnEncabezado?: boolean;
}

/** Formulario de Perfil: recibe los datos de la cuenta ya cargados del servidor. */
export interface FormularioPerfilProps {
  usuario: Usuario;
}

/** Envuelve una pantalla o un grupo y solo la muestra a los roles permitidos (RF-03, RNF-05). */
export interface RutaProtegidaProps {
  roles: readonly Rol[];
  children: ReactNode;
}

/** Una opción del menú lateral (Drawer). */
export interface OpcionMenu {
  /** Nombre de la pantalla dentro del Drawer: el archivo sin extensión, por ejemplo 'mis-pedidos'. */
  pantalla: string;
  etiqueta: string;
  icono: NombreIcono;
}

/** Contenido personalizado del Drawer: datos del usuario, opciones de su rol y Cerrar sesión. */
export interface MenuLateralProps {
  opciones: OpcionMenu[];
  /** Pantalla abierta en el Drawer, para resaltar su opción. */
  pantallaActual: string;
  /** Abre la pantalla elegida y cierra el menú. */
  onElegir: (pantalla: string) => void;
}

/** Botón de las tres rayas que abre el Drawer. */
export interface BotonMenuProps {
  onPress: () => void;
}

/** Una opción de SelectorSegmentado. */
export interface OpcionSegmentada<T extends string> {
  valor: T;
  etiqueta: string;
}

/**
 * Botones lado a lado para elegir una sola opción (mockup de Solicitar cotización:
 * Instalación / Mantenimiento). La elegida va en azul con un check.
 */
export interface SelectorSegmentadoProps<T extends string> {
  etiqueta: string;
  opciones: readonly OpcionSegmentada<T>[];
  /** null si todavía no se elige ninguna. */
  valor: T | null;
  onCambiar: (valor: T) => void;
  /** Mensaje de error bajo los botones; null o undefined si es válido. */
  error?: string | null;
}

/** Barra de búsqueda gris con lupa y botón para borrar (mockup de Clientes y Catálogo). */
export interface BarraBusquedaProps {
  valor: string;
  onChangeText: (texto: string) => void;
  placeholder: string;
}

/** Círculo azul claro con las iniciales del cliente (mockup de Clientes). */
export interface AvatarInicialesProps {
  iniciales: string;
  /** 'normal' en la lista; 'grande' en el detalle. */
  tamano?: 'normal' | 'grande';
}

/** Aviso amarillo de "Sin conexión" sobre una lista que muestra datos guardados (RNF-08). */
export interface AvisoConexionProps {
  mensaje: string;
}

/** Tarjeta de la lista de clientes: iniciales, nombre y teléfono (mockup de Clientes). */
export interface TarjetaClienteProps {
  cliente: Cliente;
  onPress: () => void;
}

/** Pantallas que cargan un registro por el id de la ruta (detalle, edición). */
export interface ContenidoPorIdProps {
  /** undefined si la ruta llegó sin id. */
  id: string | undefined;
}

/** Formulario de cliente: null para crear; el cliente cargado para editar. */
export interface FormularioClienteProps {
  cliente: Cliente | null;
}

/** Tarjeta con los datos del cliente en su detalle. */
export interface TarjetaDatosClienteProps {
  cliente: Cliente;
}

/** Una fila "ícono · etiqueta · valor" de una tarjeta de datos (mockup del detalle de cliente). */
export interface FilaDatoProps {
  icono: NombreIcono;
  etiqueta: string;
  valor: string;
}

/** Producto elegido como de interés en Solicitar cotización. */
export interface ProductoElegido {
  id: string;
  nombre: string;
}

/** Buscador del catálogo para elegir productos de interés (opcionales) al solicitar (RF-15). */
export interface SelectorProductosInteresProps {
  elegidos: ProductoElegido[];
  onCambiar: (elegidos: ProductoElegido[]) => void;
}

/** Mensaje de solicitud registrada, con el número que devolvió el servidor. */
export interface ConfirmacionSolicitudProps {
  solicitud: SolicitudCreada;
}

/** Imagen de un producto; si no tiene o no carga, muestra la imagen alternativa (RNF-02). */
export interface ImagenProductoProps {
  imagenUrl: string | null;
  /** 'miniatura' en tarjetas y carrito; 'grande' en el detalle. */
  tamano: 'miniatura' | 'grande';
}

/** Botón opcional de la tarjeta de producto, por ejemplo "+ Agregar" en el catálogo del cliente. */
export interface AccionTarjetaProducto {
  texto: string;
  icono?: NombreIcono;
  onPress: () => void;
  /** 'primario' (relleno azul, por defecto) o 'peligro' (borde rojo, por ejemplo Eliminar). */
  variante?: 'primario' | 'peligro';
  /**
   * false (por defecto): el botón se oculta si el producto está agotado o no tiene precio, porque
   * no se puede comprar. true: se muestra siempre (Eliminar en Productos del trabajador).
   */
  siempreVisible?: boolean;
}

/** Tarjeta de producto del catálogo (mockup de Catálogo, RF-05, RF-09). */
export interface TarjetaProductoProps {
  nombre: string;
  /** null si el producto no tiene código: se muestra "Sin código". */
  codigo: string | null;
  /** Nombre legible de la marca y de la categoría (NOMBRE_MARCA, NOMBRE_CATEGORIA). */
  marca: string;
  categoria: string;
  /** Precio en pesos; null si no hay precio registrado para el cliente. */
  precio: number | null;
  /** Unidades disponibles. Con 0 se muestra la etiqueta "Agotado". */
  inventario: number;
  imagenUrl: string | null;
  /** Abre el detalle del producto (o su edición, en Productos del trabajador). */
  onPress: () => void;
  /** Texto para el lector de pantalla al pulsar la tarjeta; por defecto "<nombre>, ver detalle". */
  etiquetaAccesible?: string;
  /** Contenido opcional bajo el precio, por ejemplo los precios del personal y las marcas de revisión. */
  contenidoExtra?: ReactNode;
  /** Botón opcional; no se muestra si el producto está agotado o no tiene precio. */
  accion?: AccionTarjetaProducto;
}

/** Marcas de revisión de un producto en Productos del trabajador ("Sin precio instalador"...). */
export interface MarcasRevisionProps {
  motivos: string[];
}

/** Selector de una opción en una ventana (Categoría y Marca del formulario de producto). */
export interface SelectorOpcionesProps<T extends string> {
  etiqueta: string;
  opciones: readonly OpcionSegmentada<T>[];
  /** Valor elegido. */
  valor: T;
  onCambiar: (valor: T) => void;
}

/** Advertencia naranja bajo un campo del formulario de producto (no impide guardar). */
export interface AdvertenciaCampoProps {
  texto: string;
}

/** Formulario de producto: null para crear; el producto cargado para editar. */
export interface FormularioProductoProps {
  producto: ProductoPersonal | null;
}

/** Etiqueta verde "Disponibles: N" o roja "Agotado". */
export interface EtiquetaDisponibilidadProps {
  inventario: number;
}

/**
 * Contador contextual de cantidad (RF-10, RF-16): botones − y + y entrada escrita a mano.
 * La cantidad válida va de `minimo` a `maximo` (el inventario).
 */
export interface ContadorCantidadProps {
  valor: number;
  /** Unidades disponibles: el + se deshabilita al llegar aquí. */
  maximo: number;
  /** Por defecto 1: el − no baja de aquí. */
  minimo?: number;
  /** Se llama solo con cantidades válidas. */
  onCambiar: (cantidad: number) => void;
  /** Nombre del producto para el lector de pantalla, por ejemplo "Cantidad de DVR 4 canales". */
  etiquetaAccesible?: string;
}

/** Chip de filtro (mockup de Catálogo: Cámaras, DVR, WiFi...). El activo va en azul. */
export interface ChipFiltroProps {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
}

/** Precios que ve el personal en el detalle: cliente final, instalador y costo. */
export interface PreciosPersonalProps {
  producto: ProductoPersonal;
}

/** Parte del detalle donde el cliente elige la cantidad y agrega al carrito. */
export interface CompraClienteProps {
  producto: ProductoSegunRol;
}

/** Una fila "etiqueta ........ valor" del resumen del carrito. */
export interface FilaResumenProps {
  etiqueta: string;
  valor: string;
  /** 'total' la muestra grande y en negrita; 'descuento' en verde. */
  variante?: 'normal' | 'descuento' | 'total';
}

/** Una línea del carrito con su contador y el botón Eliminar. */
export interface LineaCarritoItemProps {
  linea: LineaCarrito;
}

/** Resumen del total del carrito (subtotal, descuento, impuesto, servicio y total). */
export interface ResumenCarritoProps {
  lineas: LineaCarrito[];
  servicio: ServicioCarrito;
}

/** Opciones de servicio del carrito: sin servicio, instalación o mantenimiento (suma la tarifa). */
export interface SelectorServicioProps {
  servicio: ServicioCarrito;
  onCambiar: (servicio: ServicioCarrito) => void;
}

// ---------------------------------------------------------------------------------------------
// Cotizaciones del trabajador y Crear cotización (F6)
// ---------------------------------------------------------------------------------------------

/**
 * Etiqueta de color con el estado de una cotización (mockup de Cotizaciones).
 * Para el personal, Nueva y Vista se muestran como "Enviada" (RF-19). Para el cliente,
 * Solicitada y Borrador se muestran como "Por cotizar" (J5): todavía no le han enviado precios.
 */
export interface EtiquetaEstadoCotizacionProps {
  estado: EstadoCotizacion;
  paraPersonal?: boolean;
  /** Solo cliente: true muestra "Por cotizar" aunque el estado sea otro (llegó sin total). */
  porCotizar?: boolean;
}

/**
 * Tarjeta de la lista de cotizaciones: número, fecha, total y estado. Con una cotización del
 * personal muestra además el cliente; con una del cliente, el punto de no leída (J5, RF-20).
 */
export interface TarjetaCotizacionProps {
  cotizacion: CotizacionSegunRol;
  /** Abre el formulario (borrador) o el detalle (las demás). */
  onPress: () => void;
  /** Solo en solicitudes: botón para convertirla en cotización. */
  onCrearCotizacion?: () => void;
}

/** Campo para elegir el cliente de la cotización; abre una lista con búsqueda. */
export interface SelectorClienteProps {
  cliente: ClienteElegido | null;
  onElegir: (cliente: ClienteElegido) => void;
  /** true cuando la cotización viene de una solicitud: el cliente no se cambia. */
  bloqueado?: boolean;
  error?: string | null;
}

/** Ventana para buscar un producto del inventario y agregarlo a la cotización (RF-16). */
export interface SelectorProductoCotizacionProps {
  visible: boolean;
  /** Tipo del cliente elegido: define el precio y si el producto se puede agregar. */
  tipoCliente: TipoCliente;
  /** Productos que ya están en la cotización (no se agregan dos veces). */
  idsEnCotizacion: readonly string[];
  onElegir: (producto: ProductoSegunRol) => void;
  onCerrar: () => void;
}

/** Lista de clientes dentro de la ventana de SelectorCliente. */
export interface ListaClientesSelectorProps {
  /** Texto ya "esperado" (useRetraso) para buscar en el servidor. */
  busqueda: string;
  onElegir: (cliente: ClienteElegido) => void;
}

/** Una línea de la cotización: producto, precio, contador de cantidad y Quitar. */
export interface LineaCotizacionItemProps {
  linea: LineaVista;
  onCambiarCantidad: (cantidad: number) => void;
  onQuitar: () => void;
}

/** Resumen azul marino de la cotización (mockup): subtotal, descuento, IVA, servicio y total. */
export interface ResumenCotizacionProps {
  calculo: ResultadoCalculoTotal;
  /** Servicio incluido (para el nombre de la fila); null si no se incluye. */
  servicio: TipoServicio | null;
}

/** Formulario de la cotización: arranca vacío, con un borrador o con una solicitud. */
export interface FormularioCotizacionProps {
  inicial: ValoresInicialesCotizacion;
}

/** Mensaje de cotización enviada con lo que respondió el servidor. */
export interface ConfirmacionEnvioCotizacionProps {
  enviada: CotizacionGuardada;
  clienteNombre: string;
}

// ---------------------------------------------------------------------------------------------
// Mapa y ubicaciones (J4: RF-23 a RF-26)
// ---------------------------------------------------------------------------------------------

/** Acciones que una pantalla puede pedirle al mapa a través de su ref. */
export interface ControlMapa {
  /** Mueve la vista a un punto. Si el mapa aún carga, lo hace en cuanto esté listo. */
  centrar: (punto: Coordenadas, zoom?: number) => void;
}

/** Mapa de OpenStreetMap con Leaflet en una WebView, con tres tipos de marcador (RF-23). */
export interface MapaLeafletProps {
  /** Marcador del negocio (COORDENADAS_NEGOCIO). */
  negocio: Coordenadas;
  /** Posición del teléfono; null la quita del mapa. */
  dispositivo?: Coordenadas | null;
  /** Ubicaciones de servicio, cada una con su marcador. */
  ubicaciones?: readonly PuntoMapa[];
  /** Punto elegido en modo selección; null lo quita. */
  seleccion?: Coordenadas | null;
  /** true: tocar el mapa llama a onElegirPunto con el punto tocado. */
  modoSeleccion?: boolean;
  onElegirPunto?: (punto: Coordenadas) => void;
  /** Dónde se centra al cargar. Por defecto, el negocio. */
  centroInicial?: Coordenadas;
  ref?: Ref<ControlMapa>;
}

/** Panel inferior del mapa: Activar seguimiento, Pausar y Reanudar (mockup de Mapa, RF-25). */
export interface PanelSeguimientoProps {
  seguimiento: EstadoSeguimiento;
  /** true mientras se pide el permiso o se arranca el GPS: evita pulsar dos veces. */
  ocupado: boolean;
  onActivar: () => void;
  onPausar: () => void;
  onReanudar: () => void;
}

/** Tarjeta de una ubicación de servicio en las listas (Mis ubicaciones, Ubicaciones). */
export interface TarjetaUbicacionProps {
  ubicacion: Ubicacion;
  /** true en la lista del personal: muestra el nombre del cliente. */
  mostrarCliente?: boolean;
  onPress: () => void;
}

/** Tarjeta sobre el mapa cuando falta el permiso, el GPS está apagado o hubo un error (mockup). */
export interface AvisoUbicacionProps {
  icono: NombreIcono;
  /** Color del ícono y de su círculo de fondo. */
  color: string;
  titulo: string;
  detalle: string;
  accionPrincipal: AccionEstadoVista & { icono: NombreIcono };
  /** "Continuar sin ubicación": cierra el aviso y deja usar el mapa. */
  onCerrar: () => void;
}

/** Botón con borde de color del panel de seguimiento (Pausar, Reanudar). */
export interface BotonBordeProps {
  texto: string;
  icono: NombreIcono;
  color: string;
  habilitado: boolean;
  onPress: () => void;
}

/** Contenido de la pantalla Mapa según su modo. */
export interface ContenidoMapaProps {
  /** 'negocio': ver el negocio, mi ubicación y el seguimiento; 'elegir': marcar un punto. */
  modo: 'negocio' | 'elegir';
  /** Punto donde centrar al abrir (por ejemplo, una ubicación de la lista); null = el negocio. */
  centro: Coordenadas | null;
}

/** Formulario Registrar ubicación (RF-26). */
export interface FormularioUbicacionProps {
  /** Ficha de cliente de la cuenta (rol cliente); null para el personal, que elige el cliente. */
  clientePropioId: string | null;
}

// ---------------------------------------------------------------------------------------------
// Bandeja, detalle de cotización y confirmación de pedido (J5: RF-13, RF-20 a RF-22)
// ---------------------------------------------------------------------------------------------

/** Una línea del detalle de cotización: producto, cantidad × precio y subtotal. */
export interface LineaDetalleCotizacionProps {
  linea: LineaCotizacion;
  /** true en la última línea: no lleva separador debajo. */
  ultima: boolean;
}

/** Parte del detalle de una solicitud aún sin cotizar: productos de interés del cliente. */
export interface PorCotizarProps {
  /** Nombre de cada producto de interés, con la cantidad si el cliente la indicó. */
  productos: string[];
  paraPersonal: boolean;
}

/** Tarjeta de totales del detalle: subtotal, descuento, IVA, servicio y total. */
export interface TotalesCotizacionProps {
  cotizacion: Cotizacion;
}

/** Aviso con la fecha de vigencia de la cotización según su estado. */
export interface AvisoVigenciaProps {
  cotizacion: Cotizacion;
}

/** Botones Aceptar y Rechazar del cliente, con el error de la última acción y Reintentar. */
export interface AccionesClienteCotizacionProps {
  cotizacion: Cotizacion;
  /** Se llama tras un error que cambió el estado en el servidor (vencida, ya respondida). */
  onEstadoCambiado: () => void;
}

// ---------------------------------------------------------------------------------------------
// Pedidos, citas e Inicio del cliente (J6)
// ---------------------------------------------------------------------------------------------

/** Botón Confirmar pedido del carrito con el paso "Pago simulado" (RF-13). */
export interface ConfirmarCompraCarritoProps {
  lineas: LineaCarrito[];
  servicio: ServicioCarrito;
}

/** Recuadro rojo con el error de una acción (enviar, comprar, agendar) y Reintentar opcional. */
export interface AvisoErrorAccionProps {
  titulo: string;
  mensaje: string;
  /** Cambia el ícono por el de "sin conexión". */
  sinConexion?: boolean;
  /** Si se envía, aparece el botón Reintentar. */
  onReintentar?: () => void;
  reintentando?: boolean;
}

/** Tarjeta de un pedido en Mis pedidos: fecha, número, total y estado (RF-14). */
export interface TarjetaPedidoProps {
  pedido: Pedido;
  /**
   * Abre el detalle. Opcional desde F8: en el historial del detalle de cliente (personal) no hay
   * pantalla de detalle de pedido para el trabajador, así que la tarjeta solo se muestra.
   */
  onPress?: () => void;
}

/** Una línea del detalle de pedido. */
export interface LineaPedidoItemProps {
  linea: LineaPedido;
  ultima: boolean;
}

/** Píldora de color con el estado de una cita. */
export interface EtiquetaEstadoCitaProps {
  estado: EstadoCita;
}

/** Píldora de color con el tipo de servicio (Instalación azul, Mantenimiento naranja). */
export interface EtiquetaTipoServicioProps {
  tipo: TipoServicio;
}

/**
 * Tarjeta de una cita (Mis citas y Citas del trabajador). Con onCambiarEstado (solo personal)
 * muestra los botones Realizada y Cancelar en las citas Programadas.
 */
export interface TarjetaCitaProps {
  cita: Cita;
  /** true: muestra el nombre del cliente (lista del trabajador). */
  paraPersonal?: boolean;
  onCambiarEstado?: (estado: EstadoFinalCita) => void;
  /** true mientras se guarda el cambio de esta cita (botones bloqueados). */
  cambiando?: boolean;
}

/** Opción elegible en forma de tarjeta (ubicación o pedido en Agendar cita). */
export interface OpcionTarjetaProps {
  titulo: string;
  detalle?: string | null;
  icono: NombreIcono;
  elegida: boolean;
  onPress: () => void;
}

/** Tarjeta de resumen del Inicio del cliente con su propio estado de carga y error. */
export interface TarjetaResumenInicioProps {
  titulo: string;
  icono: NombreIcono;
  cargando: boolean;
  /** Mensaje de error si no se pudo cargar (y no hay datos guardados). */
  error: string | null;
  onReintentar: () => void;
  /** Al tocar la tarjeta (por ejemplo, ir a Mis citas). */
  onPress?: () => void;
  children: ReactNode;
}

/** Fila con ícono y texto de la tarjeta de cita (cliente, dirección, pedido). */
export interface DatoConIconoProps {
  icono: NombreIcono;
  texto: string;
}

/** Fila "ícono · etiqueta ........ valor" del resumen de la cita confirmada (mockup). */
export interface FilaResumenCitaProps {
  icono: NombreIcono;
  etiqueta: string;
  valor: string;
}

/** Pantalla "¡Cita confirmada!" con el resumen que devolvió el servidor. */
export interface CitaConfirmadaProps {
  cita: Cita;
}

/** Botón grande de acceso rápido del Inicio del cliente (mockup). */
export interface BotonInicioProps {
  texto: string;
  icono: NombreIcono;
  /** true: relleno azul (Solicitar cotización); false: con borde. */
  principal?: boolean;
  onPress: () => void;
}

// ---------------------------------------------------------------------------------------------
// Administración (F8): Usuarios y roles, Panel general e historial del cliente
// ---------------------------------------------------------------------------------------------

/** Formulario de usuario: null para crear; el usuario cargado para editar (RF-34). */
export interface FormularioUsuarioProps {
  usuario: UsuarioAdmin | null;
}

/** Tarjeta de la lista de Usuarios y roles: iniciales, nombre, correo, rol y estado (mockup). */
export interface TarjetaUsuarioProps {
  usuario: UsuarioAdmin;
  onPress: () => void;
}

/** Píldora de color con el rol (mockup: Cliente azul claro, Trabajador verde, Administrador marino). */
export interface EtiquetaRolProps {
  rol: Rol;
}

/** Flechas y nombre del mes del Panel general (RF-35). */
export interface SelectorMesProps {
  /** Mes elegido, "AAAA-MM". */
  mes: string;
  onCambiar: (mes: string) => void;
}

/** Tarjetas de totales del periodo arriba del Panel general. */
export interface TotalesVentasProps {
  totales: TotalesVentas;
}

/** Tarjeta pequeña de un total del Panel general: ícono en círculo, valor y etiqueta (mockup). */
export interface TarjetaDatoVentaProps {
  icono: NombreIcono;
  /** Color del ícono; el círculo usa el mismo color, transparente. */
  color: string;
  valor: string;
  etiqueta: string;
}

/**
 * Tarjeta de resumen del Panel general (pedidos del mes, cotizaciones pendientes, citas
 * programadas, stock bajo). Cada una con su carga y su error.
 */
export interface TarjetaIndicadorProps {
  icono: NombreIcono;
  /** Color del ícono y de su círculo (transparente). */
  color: string;
  etiqueta: string;
  /** null mientras carga o si falló. */
  valor: number | null;
  cargando: boolean;
  /** Mensaje del error o null. */
  error: string | null;
  onReintentar: () => void;
  /** Abre su lista; sin onPress la tarjeta no se puede tocar. */
  onPress?: () => void;
}

/** Las cuatro tarjetas de resumen del Panel general. */
export interface TarjetasResumenPanelProps {
  /** Mes elegido, "AAAA-MM": lo usa Pedidos del mes. */
  mes: string;
}

/** Gráfica de barras del Panel general: productos vendidos, de mayor a menor venta. */
export interface GraficaVentasProps {
  productos: VentaProducto[];
}

/** Tarjeta de un producto en el Panel general: unidades y ventas por tipo de cliente y ganancia. */
export interface TarjetaVentaProductoProps {
  venta: VentaProducto;
}

/** Título y contenido de una sección del historial del detalle de cliente (RF-33). */
export interface SeccionHistorialProps {
  titulo: string;
  children: ReactNode;
}

/** Historial del detalle de cliente: todas las listas son solo de ese cliente. */
export interface HistorialClienteProps {
  clienteId: string;
}
