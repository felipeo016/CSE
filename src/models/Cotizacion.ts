import type { ClienteResumen } from './Cliente';

/**
 * Estado de una cotización (sección 5):
 *   solicitada → borrador → nueva → vista → aceptada | rechazada | vencida
 * Del lado del cliente: Nueva (sin abrir), Vista, Aceptada, Rechazada y Vencida.
 * Del lado del trabajador: Solicitada y Borrador; "Enviada" (RF-19) equivale a Nueva o Vista.
 * Una cotización Nueva o Vista cuya vigencia ya pasó se muestra como Vencida.
 */
export type EstadoCotizacion =
  | 'solicitada'
  | 'borrador'
  | 'nueva'
  | 'vista'
  | 'aceptada'
  | 'rechazada'
  | 'vencida';

/** Tipo de servicio que pide el cliente (RF-15). */
export type TipoServicio = 'instalacion' | 'mantenimiento';

/** Nombre visible de cada estado. */
export const NOMBRE_ESTADO_COTIZACION: Record<EstadoCotizacion, string> = {
  solicitada: 'Solicitada',
  borrador: 'Borrador',
  nueva: 'Nueva',
  vista: 'Vista',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  vencida: 'Vencida',
};

/** Nombre visible de cada tipo de servicio. */
export const NOMBRE_TIPO_SERVICIO: Record<TipoServicio, string> = {
  instalacion: 'Instalación',
  mantenimiento: 'Mantenimiento',
};

/** Estados que RF-19 agrupa como "Enviada": el cliente ya la recibió y aún puede responder. */
export const ESTADOS_ENVIADA: readonly EstadoCotizacion[] = ['nueva', 'vista'];

/**
 * Estados que el cliente ve como "Por cotizar" (J5, RF-20): su solicitud todavía no tiene precios
 * enviados. El Borrador es la cotización que el trabajador está preparando; el cliente no ve sus
 * líneas ni su total hasta que se la envían.
 */
export const ESTADOS_POR_COTIZAR: readonly EstadoCotizacion[] = ['solicitada', 'borrador'];

/** Texto que ve el cliente en una solicitud que aún no se cotiza. */
export const TEXTO_POR_COTIZAR = 'Por cotizar';

/** true si la cotización todavía no se le ha enviado al cliente (Solicitada o Borrador). */
export function esPorCotizar(estado: EstadoCotizacion): boolean {
  return ESTADOS_POR_COTIZAR.includes(estado);
}

/**
 * Filtros del listado del trabajador (RF-19). "enviada" agrupa Nueva y Vista.
 * Se agrega "vencida" para poder ver las que vencieron sin respuesta.
 */
export type FiltroEstadoCotizacion =
  | 'solicitada'
  | 'borrador'
  | 'enviada'
  | 'aceptada'
  | 'rechazada'
  | 'vencida';

/** Nombre visible de cada filtro, en el orden de RF-19. */
export const NOMBRE_FILTRO_COTIZACION: Record<FiltroEstadoCotizacion, string> = {
  solicitada: 'Solicitada',
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  vencida: 'Vencida',
};

/** Filtros del listado. Todos opcionales: sin filtros se listan todas las visibles para el rol. */
export interface FiltrosCotizaciones {
  estado?: FiltroEstadoCotizacion;
  /** Texto para buscar por nombre del cliente (solo personal). */
  busquedaCliente?: string;
  /** Cotizaciones de un cliente (historial del detalle de cliente, F8). Solo personal. */
  clienteId?: string;
}

/** Línea de la cotización: producto, cantidad y precio copiados al momento de cotizar. */
export interface LineaCotizacion {
  id: string;
  productoId: string;
  codigo: string | null;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

/** Producto que el cliente indicó como de interés al solicitar (RF-15). */
export interface ProductoInteres {
  id: string;
  productoId: string;
  nombre: string;
  /** Opcional: null si el cliente no indicó cantidad. */
  cantidad: number | null;
}

/**
 * Cotización como la ve el cliente (bandeja y detalle, RF-20 y RF-21).
 * No tiene costo ni ganancia (RNF-06): el servidor nunca los envía y aquí no existen los campos.
 * valorServicio es lo que el cliente paga por la instalación o el mantenimiento.
 * Las fechas son textos ISO del servidor; las pantallas las formatean.
 */
export interface Cotizacion {
  id: string;
  /** Número legible, por ejemplo COT-00042. */
  numero: string;
  tipoServicio: TipoServicio;
  tipoServicioNombre: string;
  /** Descripción de la necesidad escrita por el cliente; texto vacío si no hay. */
  descripcion: string;
  /** Estado para mostrar: Nueva o Vista con la vigencia vencida llega como 'vencida'. */
  estado: EstadoCotizacion;
  estadoNombre: string;
  /** true si es "Enviada" en términos de RF-19 (Nueva o Vista y sin vencer). */
  enviada: boolean;
  /** true si el cliente aún no la abre (Nueva): la bandeja la resalta (RF-20). */
  noLeida: boolean;
  /** true si el cliente todavía puede aceptarla o rechazarla (RF-22): enviada y con total. */
  puedeResponder: boolean;
  /**
   * false si el servidor no envió el total (null o sin la columna). En ese caso total y los
   * demás valores de dinero quedan en 0 y no se deben mostrar.
   */
  totalDisponible: boolean;
  /**
   * true si el cliente la ve como "Por cotizar" (J5): está en Solicitada o Borrador, o el
   * servidor no envió su total. Entonces no se muestran líneas, totales ni Aceptar/Rechazar.
   */
  porCotizar: boolean;
  subtotal: number;
  descuento: number;
  impuesto: number;
  incluyeServicio: boolean;
  valorServicio: number;
  total: number;
  venceEn: string | null;
  enviadaEn: string | null;
  creadoEn: string;
  lineas: LineaCotizacion[];
  productosInteres: ProductoInteres[];
}

/** Cotización como la ve el personal: agrega el cliente al que pertenece. */
export interface CotizacionPersonal extends Cotizacion {
  clienteId: string;
  /** null solo si el servidor no pudo incluir el cliente (no debería pasar). */
  cliente: ClienteResumen | null;
}

/** Lo que devuelven las consultas de cotizaciones: depende del rol de la sesión. */
export type CotizacionSegunRol = Cotizacion | CotizacionPersonal;

/** Indica si una cotización trae los datos del personal (el cliente al que pertenece). */
export function esCotizacionPersonal(
  cotizacion: CotizacionSegunRol,
): cotizacion is CotizacionPersonal {
  return 'clienteId' in cotizacion;
}

/** Producto de interés que el cliente elige al solicitar. La cantidad es opcional. */
export interface ProductoInteresSolicitud {
  productoId: string;
  cantidad?: number;
}

/** Datos del formulario Solicitar cotización (RF-15). */
export interface DatosSolicitudCotizacion {
  tipoServicio: TipoServicio;
  descripcion: string;
  productosInteres: ProductoInteresSolicitud[];
}

/** Respuesta del servidor al registrar una solicitud. */
export interface SolicitudCreada {
  id: string;
  numero: string;
  estado: EstadoCotizacion;
}

/** Línea de un borrador: producto y cantidad (el servidor pone nombre, código y precio). */
export interface LineaBorrador {
  productoId: string;
  cantidad: number;
}

/**
 * Datos para guardar un borrador (RF-16, RF-17; pantalla de F6).
 * id: la cotización a completar (una solicitud o un borrador); sin id se crea una nueva.
 */
export interface DatosBorradorCotizacion {
  id?: string;
  clienteId: string;
  tipoServicio: TipoServicio;
  descripcion: string;
  /** En pesos; lo ingresa el trabajador (decisión del equipo). */
  descuento: number;
  incluyeServicio: boolean;
  /** null: el servidor usa la tarifa de parametros_negocio. */
  valorServicio: number | null;
  lineas: LineaBorrador[];
}

/**
 * Respuesta del servidor al guardar un borrador o al enviarlo (F6). El total es el que calculó
 * el servidor: la pantalla lo compara con el que mostró la app.
 */
export interface CotizacionGuardada {
  id: string;
  numero: string;
  estado: EstadoCotizacion;
  total: number;
  /** null mientras es borrador; al enviar, fecha de envío + días de vigencia. */
  venceEn: string | null;
}

/** Pedido creado al aceptar una cotización (RF-22). Se muestra en Confirmación de pedido. */
export interface PedidoCreado {
  id: string;
  numero: string;
  total: number;
}
