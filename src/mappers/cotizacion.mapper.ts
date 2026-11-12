import type {
  CotizacionClienteApi,
  CotizacionFilaApi,
  CotizacionLineaApi,
  CotizacionPersonalApi,
  CotizacionProductoInteresApi,
  EstadoCotizacionApi,
  PedidoApi,
} from '../types/api.types';
import {
  ESTADOS_ENVIADA,
  esPorCotizar,
  NOMBRE_ESTADO_COTIZACION,
  NOMBRE_TIPO_SERVICIO,
  type Cotizacion,
  type CotizacionGuardada,
  type CotizacionPersonal,
  type EstadoCotizacion,
  type LineaCotizacion,
  type PedidoCreado,
  type ProductoInteres,
  type SolicitudCreada,
} from '../models/Cotizacion';
import { mapearClienteResumen } from './cliente.mapper';

/**
 * Convierte las cotizaciones del servidor (snake_case) en los modelos de la app.
 * Aquí se decide el estado que se muestra (Vencida) y se normalizan los números.
 */

/** Número finito y no negativo; cualquier otro valor (también null o ausente) se trata como 0. */
function dinero(valor: number | null | undefined): number {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : 0;
}

/**
 * Estado que se muestra (decisión del equipo): una cotización Nueva o Vista cuya vigencia ya
 * pasó es Vencida, aunque en la base siga guardada como nueva o vista. El servidor también lo
 * calcula (estado_actual); aquí se repite con la hora del teléfono por si venció mientras la
 * pantalla estaba abierta.
 * @param ahora se recibe como parámetro para poder probar la función con cualquier fecha.
 */
export function estadoVisible(
  estado: EstadoCotizacionApi,
  venceEn: string | null,
  ahora: Date = new Date(),
): EstadoCotizacion {
  if ((estado === 'nueva' || estado === 'vista') && venceEn !== null) {
    const vence = new Date(venceEn);
    if (!Number.isNaN(vence.getTime()) && vence.getTime() < ahora.getTime()) {
      return 'vencida';
    }
  }
  return estado;
}

/** true si el estado es "Enviada" de RF-19: Nueva o Vista (sin vencer). */
export function esEstadoEnviada(estado: EstadoCotizacion): boolean {
  return ESTADOS_ENVIADA.includes(estado);
}

function mapearLinea(fila: CotizacionLineaApi): LineaCotizacion {
  return {
    id: fila.id,
    productoId: fila.producto_id,
    codigo: fila.codigo_producto?.trim() || null,
    nombre: fila.nombre_producto.trim(),
    precioUnitario: dinero(fila.precio_unitario),
    cantidad: Number(fila.cantidad),
    subtotal: dinero(fila.subtotal),
  };
}

function mapearProductoInteres(fila: CotizacionProductoInteresApi): ProductoInteres {
  return {
    id: fila.id,
    productoId: fila.producto_id,
    nombre: fila.nombre_producto.trim(),
    cantidad: fila.cantidad === null ? null : Number(fila.cantidad),
  };
}

/**
 * Fila de cotización → Cotizacion (versión del cliente).
 * Solo copia los campos del modelo del cliente: aunque el servidor mandara algo más, no pasa.
 */
export function mapearCotizacionCliente(fila: CotizacionClienteApi): Cotizacion {
  // Se parte de estado_actual (calculado en el servidor) y se revisa otra vez la vigencia.
  const estado = estadoVisible(fila.estado_actual ?? fila.estado, fila.vence_en);
  const enviada = esEstadoEnviada(estado);
  // El servidor puede no enviar el total (null o sin la columna). Se guarda la señal antes de
  // que dinero() lo convierta en 0; un total de 0 que sí llega es un total válido.
  const totalDisponible = fila.total !== null && fila.total !== undefined;
  // "Por cotizar" para el cliente (J5): todavía no se la envían o no llegó su total.
  const porCotizar = esPorCotizar(estado) || !totalDisponible;
  return {
    id: fila.id,
    numero: fila.numero,
    tipoServicio: fila.tipo_servicio,
    tipoServicioNombre: NOMBRE_TIPO_SERVICIO[fila.tipo_servicio] ?? fila.tipo_servicio,
    descripcion: fila.descripcion_necesidad?.trim() ?? '',
    estado,
    estadoNombre: NOMBRE_ESTADO_COTIZACION[estado],
    enviada,
    noLeida: estado === 'nueva',
    // Sin total no se puede aceptar: el cliente no sabría cuánto paga.
    puedeResponder: enviada && !porCotizar,
    totalDisponible,
    porCotizar,
    subtotal: dinero(fila.subtotal),
    descuento: dinero(fila.descuento),
    impuesto: dinero(fila.impuesto),
    incluyeServicio: fila.incluye_servicio,
    valorServicio: dinero(fila.costo_servicio),
    total: dinero(fila.total),
    venceEn: fila.vence_en,
    enviadaEn: fila.enviada_en,
    creadoEn: fila.creado_en,
    lineas: (fila.cotizacion_lineas ?? []).map(mapearLinea),
    productosInteres: (fila.cotizacion_productos_interes ?? []).map(mapearProductoInteres),
  };
}

/** Fila de cotización del personal → CotizacionPersonal (agrega el cliente). */
export function mapearCotizacionPersonal(fila: CotizacionPersonalApi): CotizacionPersonal {
  return {
    ...mapearCotizacionCliente(fila),
    clienteId: fila.cliente_id,
    cliente: fila.cliente ? mapearClienteResumen(fila.cliente) : null,
  };
}

/** Cotización que devuelve la RPC crear_solicitud_cotizacion → SolicitudCreada. */
export function mapearSolicitudCreada(fila: CotizacionFilaApi): SolicitudCreada {
  return {
    id: fila.id,
    numero: fila.numero,
    estado: estadoVisible(fila.estado, fila.vence_en),
  };
}

/**
 * Cotización que devuelven guardar_borrador_cotizacion y el envío → CotizacionGuardada.
 * El total es el que calculó el servidor.
 */
export function mapearCotizacionGuardada(fila: CotizacionFilaApi): CotizacionGuardada {
  return {
    id: fila.id,
    numero: fila.numero,
    estado: estadoVisible(fila.estado, fila.vence_en),
    total: dinero(fila.total),
    venceEn: fila.vence_en,
  };
}

/** Pedido que devuelve la RPC aceptar_cotizacion → PedidoCreado. */
export function mapearPedidoCreado(fila: PedidoApi): PedidoCreado {
  return {
    id: fila.id,
    numero: fila.numero,
    total: dinero(fila.total),
  };
}
