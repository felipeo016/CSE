import { api } from './api';
import { mapearPedido } from '../mappers/pedido.mapper';
import type { DatosCompraCarrito, Pedido } from '../models/Pedido';
import type { PedidoApi, PedidoCarritoCuerpoApi, PedidoConLineasApi } from '../types/api.types';
import { esUuid } from '../utils/consultas';

/**
 * Pedidos (RF-13, RF-14). Todas las peticiones usan la instancia de Axios de api.ts.
 * La base decide qué filas ve cada rol (RLS): el cliente solo recibe sus pedidos. Los pedidos solo
 * se crean con las RPC (registrar_pedido_carrito o aceptar_cotizacion); nadie los inserta directo.
 */

const RUTA_PEDIDOS = '/rest/v1/pedidos';
const RUTA_RPC = '/rest/v1/rpc';

/** Columnas que se piden (nunca select=*). Ninguna es costo ni ganancia (RNF-06). */
const COLUMNAS = [
  'id',
  'numero',
  'cliente_id',
  'origen',
  'cotizacion_id',
  'subtotal',
  'descuento',
  'impuesto',
  'incluye_servicio',
  'tipo_servicio',
  'costo_servicio',
  'total',
  'estado',
  'creado_en',
  'pedido_lineas(id,producto_id,codigo_producto,nombre_producto,precio_unitario,cantidad,subtotal)',
].join(',');

/** Pedidos de un cliente, del más reciente al más antiguo (Mis pedidos, RF-14). */
export async function listarPedidosCliente(clienteId: string): Promise<Pedido[]> {
  if (!esUuid(clienteId)) {
    return [];
  }
  const respuesta = await api.get<PedidoConLineasApi[]>(RUTA_PEDIDOS, {
    params: {
      select: COLUMNAS,
      cliente_id: `eq.${clienteId}`,
      order: 'creado_en.desc',
      'pedido_lineas.order': 'nombre_producto',
    },
  });
  return respuesta.data.map(mapearPedido);
}

/**
 * Busca un pedido por id con sus líneas (Detalle de pedido). Devuelve null si no existe, si el id
 * no tiene formato válido o si es de otro cliente (la base no se lo entrega).
 */
export async function obtenerPedido(id: string): Promise<Pedido | null> {
  if (!esUuid(id)) {
    return null;
  }
  const respuesta = await api.get<PedidoConLineasApi[]>(RUTA_PEDIDOS, {
    params: { select: COLUMNAS, id: `eq.${id}`, 'pedido_lineas.order': 'nombre_producto' },
  });
  const fila = respuesta.data[0];
  return fila ? mapearPedido(fila) : null;
}

/**
 * Registra la compra del carrito (RF-13) con la RPC registrar_pedido_carrito, en una sola
 * transacción del servidor: toma el precio según el tipo del cliente, bloquea los productos y
 * verifica el inventario antes de descontarlo. Si un producto no alcanza, responde con el hint
 * INVENTARIO_INSUFICIENTE (ya traducido a ErrorApi por api.ts) y no se crea nada.
 * Con compra_id (migración 008) un Reintentar no crea un segundo pedido: si la compra ya quedó
 * registrada, el servidor devuelve ese pedido; si el carrito cambió, responde COMPRA_YA_REGISTRADA.
 */
export async function registrarPedidoCarrito(datos: DatosCompraCarrito): Promise<Pedido> {
  const cuerpo: PedidoCarritoCuerpoApi = {
    lineas: datos.lineas.map((linea) => ({ producto_id: linea.productoId, cantidad: linea.cantidad })),
    incluye_servicio: datos.servicio !== null,
    tipo_servicio: datos.servicio,
    compra_id: datos.compraId,
  };
  const respuesta = await api.post<PedidoApi>(`${RUTA_RPC}/registrar_pedido_carrito`, cuerpo);
  return mapearPedido(respuesta.data);
}
