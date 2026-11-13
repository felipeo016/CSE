import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  contarPedidosDelMes,
  listarPedidosCliente,
  obtenerPedido,
  registrarPedidoCarrito,
} from '../services/pedidos.service';
import { useSesionStore } from '../store/sesionStore';
import { useEnLinea } from './useEnLinea';
import type { DatosCompraCarrito, Pedido } from '../models/Pedido';
import type { ErrorApi } from '../types/api.types';
import { conAvisoDeConexion, debeReintentar, type ConsultaConConexion } from '../utils/consultas';

/**
 * Tiempos de caché de los pedidos (RNF-03):
 * - staleTime 1 min: un pedido no cambia después de creado (solo Pendiente en esta versión) y al
 *   comprar se invalida la lista, así que no hace falta pedirla a cada rato.
 * - gcTime 10 min: sin conexión todavía hay una lista que mostrar con el aviso.
 */
const STALE_TIME_PEDIDOS_MS = 60 * 1000;
const GC_TIME_PEDIDOS_MS = 10 * 60 * 1000;

/** queryKey de los pedidos de un cliente. Todas empiezan con 'pedidos' para invalidarlas juntas. */
export function clavePedidosCliente(clienteId: string | null) {
  return ['pedidos', 'cliente', clienteId] as const;
}

/** queryKey del detalle de un pedido. */
export function clavePedido(id: string | undefined) {
  return ['pedidos', 'detalle', id] as const;
}

/**
 * Pedidos del cliente de la sesión (Mis pedidos, RF-14, y el selector de Agendar cita).
 * networkMode 'always': sin conexión falla enseguida y la pantalla muestra la caché con aviso o el
 * error con Reintentar.
 */
export function usePedidosCliente(): ConsultaConConexion<Pedido[]> {
  const clienteId = useSesionStore((estado) => estado.usuario?.clienteId ?? null);
  const enLinea = useEnLinea();
  const consulta = useQuery<Pedido[], ErrorApi>({
    queryKey: clavePedidosCliente(clienteId),
    queryFn: () => listarPedidosCliente(clienteId ?? ''),
    enabled: clienteId !== null,
    staleTime: STALE_TIME_PEDIDOS_MS,
    gcTime: GC_TIME_PEDIDOS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/**
 * Pedidos de un cliente elegido, para el trabajador y el administrador (historial del Detalle de
 * cliente, RF-33; F8). Usa el mismo servicio y la misma queryKey que Mis pedidos: la RLS le
 * entrega al personal los pedidos de cualquier cliente y el filtro cliente_id deja solo los de ese.
 */
export function usePedidosDeCliente(clienteId: string | undefined): ConsultaConConexion<Pedido[]> {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const consulta = useQuery<Pedido[], ErrorApi>({
    queryKey: clavePedidosCliente(clienteId ?? null),
    queryFn: () => listarPedidosCliente(clienteId ?? ''),
    enabled: hayUsuario && clienteId !== undefined && clienteId.length > 0,
    staleTime: STALE_TIME_PEDIDOS_MS,
    gcTime: GC_TIME_PEDIDOS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/**
 * Cantidad de pedidos de un mes ("AAAA-MM") para el Panel general. Solo se pide con una sesión del
 * personal: es una consulta de todos los clientes.
 */
export function usePedidosDelMes(mes: string): ConsultaConConexion<number> {
  const esPersonal = useSesionStore(
    (estado) => estado.usuario?.rol === 'trabajador' || estado.usuario?.rol === 'administrador',
  );
  const enLinea = useEnLinea();
  const consulta = useQuery<number, ErrorApi>({
    queryKey: ['pedidos', 'mes', mes],
    queryFn: () => contarPedidosDelMes(mes),
    enabled: esPersonal,
    staleTime: STALE_TIME_PEDIDOS_MS,
    gcTime: GC_TIME_PEDIDOS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/** Detalle de un pedido con sus líneas. data es null si no existe o es de otro cliente. */
export function usePedido(id: string | undefined): ConsultaConConexion<Pedido | null> {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const consulta = useQuery<Pedido | null, ErrorApi>({
    queryKey: clavePedido(id),
    queryFn: () => obtenerPedido(id ?? ''),
    enabled: hayUsuario && id !== undefined && id.length > 0,
    staleTime: STALE_TIME_PEDIDOS_MS,
    gcTime: GC_TIME_PEDIDOS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/**
 * Confirma la compra del carrito (RF-13). Nunca se confirma sin respuesta del servidor (RNF-08):
 * networkMode 'always' hace que sin conexión falle enseguida y no se repite sola (retry 0 del
 * queryClient); el usuario pulsa Reintentar.
 * - Si sale bien cambian el inventario y los pedidos: se marcan esas consultas como viejas.
 * - Si falta inventario también se marcan los productos, para que el catálogo muestre las
 *   existencias reales.
 */
export function useRegistrarPedidoCarrito() {
  const clienteQuery = useQueryClient();
  return useMutation<Pedido, ErrorApi, DatosCompraCarrito>({
    mutationFn: registrarPedidoCarrito,
    networkMode: 'always',
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['productos'] });
      clienteQuery.invalidateQueries({ queryKey: ['pedidos'] });
    },
    onError: (error) => {
      if (error.codigo === 'INVENTARIO_INSUFICIENTE') {
        clienteQuery.invalidateQueries({ queryKey: ['productos'] });
      }
      // La compra anterior sí quedó registrada: Mis pedidos y el inventario ya cambiaron.
      if (error.codigo === 'COMPRA_YA_REGISTRADA') {
        clienteQuery.invalidateQueries({ queryKey: ['productos'] });
        clienteQuery.invalidateQueries({ queryKey: ['pedidos'] });
      }
    },
  });
}
