import type { PedidoApi, PedidoConLineasApi, PedidoLineaApi } from '../types/api.types';
import { NOMBRE_TIPO_SERVICIO } from '../models/Cotizacion';
import {
  NOMBRE_ESTADO_PEDIDO,
  NOMBRE_ORIGEN_PEDIDO,
  type LineaPedido,
  type Pedido,
} from '../models/Pedido';

/** Número finito y no negativo; cualquier otro valor (también null o ausente) se trata como 0. */
function dinero(valor: number | null | undefined): number {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : 0;
}

function mapearLineaPedido(fila: PedidoLineaApi): LineaPedido {
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

/**
 * Fila de pedidos (snake_case) → Pedido. Las líneas son opcionales: la RPC
 * registrar_pedido_carrito devuelve solo la cabecera.
 */
export function mapearPedido(fila: PedidoApi | PedidoConLineasApi): Pedido {
  const lineas = 'pedido_lineas' in fila ? (fila.pedido_lineas ?? []).map(mapearLineaPedido) : [];
  const tipoServicio = fila.incluye_servicio ? fila.tipo_servicio : null;
  return {
    id: fila.id,
    numero: fila.numero,
    origen: fila.origen,
    origenNombre: NOMBRE_ORIGEN_PEDIDO[fila.origen] ?? fila.origen,
    subtotal: dinero(fila.subtotal),
    descuento: dinero(fila.descuento),
    impuesto: dinero(fila.impuesto),
    incluyeServicio: fila.incluye_servicio,
    tipoServicio,
    tipoServicioNombre: tipoServicio ? NOMBRE_TIPO_SERVICIO[tipoServicio] : null,
    valorServicio: dinero(fila.costo_servicio),
    total: dinero(fila.total),
    estado: fila.estado,
    estadoNombre: NOMBRE_ESTADO_PEDIDO[fila.estado] ?? fila.estado,
    creadoEn: fila.creado_en,
    lineas,
    unidades: lineas.reduce((suma, linea) => suma + linea.cantidad, 0),
  };
}
