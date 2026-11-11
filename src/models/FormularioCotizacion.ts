import type { TipoServicio } from './Cotizacion';
import type { TipoCliente } from './Producto';

/**
 * Tipos del formulario Crear cotización (F6, RF-16 a RF-18).
 * El formulario guarda lo mínimo (producto y cantidad); el resto de cada línea (nombre, precio,
 * inventario) se toma del inventario actual con useProductos, para mostrar siempre datos al día.
 */

/** Cliente elegido en el formulario. Su tipo define el precio de cada línea. */
export interface ClienteElegido {
  id: string;
  nombre: string;
  tipo: TipoCliente;
}

/** Línea tal como se guarda en el estado del formulario. */
export interface LineaEnFormulario {
  productoId: string;
  cantidad: number;
  /** Nombre guardado en el borrador, por si el producto ya no está en el inventario. */
  nombreGuardado: string;
}

/** Línea lista para mostrar: datos del producto, precio según el tipo del cliente y su error. */
export interface LineaVista {
  productoId: string;
  nombre: string;
  codigo: string | null;
  imagenUrl: string | null;
  /** Precio para el tipo del cliente; null si no está registrado o el producto no existe. */
  precio: number | null;
  /** Unidades disponibles hoy (0 si el producto ya no está en el inventario). */
  inventario: number;
  cantidad: number;
  /** Por qué esta línea no se puede guardar; null si está bien. */
  error: string | null;
}

/** Valores con los que arranca el formulario: vacío, un borrador o una solicitud. */
export interface ValoresInicialesCotizacion {
  /** Cotización que se completa (solicitud o borrador); undefined si es nueva. */
  id?: string;
  /** Número COT-xxxxx si ya existe en el servidor. */
  numero: string | null;
  /** true si viene de una solicitud del cliente: el cliente no se cambia. */
  esSolicitud: boolean;
  cliente: ClienteElegido | null;
  tipoServicio: TipoServicio | null;
  /** Descripción de la necesidad (la de la solicitud, si existe). */
  descripcion: string;
  descuentoTexto: string;
  incluyeServicio: boolean;
  costoServicioTexto: string;
  lineas: LineaEnFormulario[];
  /** Productos de interés de la solicitud que no se pudieron agregar, con el motivo. */
  avisos: string[];
}

/** Mensajes por campo del formulario (null = válido). */
export interface ErroresFormularioCotizacion {
  cliente: string | null;
  tipoServicio: string | null;
  lineas: string | null;
}
