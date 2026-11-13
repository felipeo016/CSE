import type { TipoServicio } from './Cotizacion';

/**
 * Pedido del cliente (RF-13, RF-14, RF-22). Se crea al confirmar el carrito o al aceptar una
 * cotización, siempre en el servidor. No tiene costo ni ganancia (RNF-06): el servidor nunca los
 * envía y aquí no existen los campos.
 */

/** En esta versión el pedido solo tiene el estado Pendiente (decisión del equipo). */
export type EstadoPedido = 'pendiente';

export const NOMBRE_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
};

/** De dónde salió el pedido. */
export type OrigenPedido = 'carrito' | 'cotizacion';

export const NOMBRE_ORIGEN_PEDIDO: Record<OrigenPedido, string> = {
  carrito: 'Compra desde el carrito',
  cotizacion: 'Cotización aceptada',
};

/** Línea del pedido: producto, cantidad y precio copiados al momento de comprar. */
export interface LineaPedido {
  id: string;
  productoId: string;
  codigo: string | null;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  /** Número legible, por ejemplo PED-00012. */
  numero: string;
  origen: OrigenPedido;
  origenNombre: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  incluyeServicio: boolean;
  /** null si el pedido no incluye servicio. */
  tipoServicio: TipoServicio | null;
  /** "Instalación" o "Mantenimiento"; null si no incluye servicio. */
  tipoServicioNombre: string | null;
  valorServicio: number;
  total: number;
  estado: EstadoPedido;
  estadoNombre: string;
  /** Fecha del pedido en formato ISO. */
  creadoEn: string;
  lineas: LineaPedido[];
  /** Suma de las cantidades de las líneas. */
  unidades: number;
}

/** Producto y cantidad que se envían al comprar (el precio lo pone el servidor). */
export interface LineaCompra {
  productoId: string;
  cantidad: number;
}

/** Datos para registrar la compra del carrito (RF-13). */
export interface DatosCompraCarrito {
  lineas: LineaCompra[];
  /** Servicio pedido con la compra; null = sin servicio. */
  servicio: TipoServicio | null;
}
