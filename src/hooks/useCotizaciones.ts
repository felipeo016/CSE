import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import {
  aceptarCotizacion,
  crearSolicitudCotizacion,
  enviarCotizacion,
  guardarBorradorCotizacion,
  listarCotizaciones,
  marcarCotizacionVista,
  obtenerCotizacion,
  rechazarCotizacion,
} from '../services/cotizaciones.service';
import { useSesionStore } from '../store/sesionStore';
import { useEnLinea } from './useEnLinea';
import type {
  CotizacionGuardada,
  CotizacionSegunRol,
  DatosBorradorCotizacion,
  DatosSolicitudCotizacion,
  FiltrosCotizaciones,
  PedidoCreado,
  SolicitudCreada,
} from '../models/Cotizacion';
import type { ErrorApi } from '../types/api.types';
import { conAvisoDeConexion, debeReintentar, type ConsultaConConexion } from '../utils/consultas';

/**
 * Tiempos de caché de cotizaciones (RNF-03):
 * - staleTime 30 s: una cotización cambia desde otro teléfono (el trabajador la envía, el cliente
 *   la acepta). Pasados 30 s, volver a la pantalla la pide de nuevo; deslizar para recargar
 *   siempre la pide (RF-20).
 * - gcTime 10 min: sin conexión todavía hay una bandeja que mostrar con el aviso.
 */
const STALE_TIME_COTIZACIONES_MS = 30 * 1000;
const GC_TIME_COTIZACIONES_MS = 10 * 60 * 1000;

/** queryKey del listado: un resultado por combinación de filtros. */
export function claveCotizaciones(filtros: FiltrosCotizaciones) {
  return ['cotizaciones', filtros] as const;
}

/** queryKey del detalle. Al cerrar sesión se borra toda la caché (sesionStore). */
export function claveCotizacion(id: string | undefined) {
  return ['cotizacion', id] as const;
}

/**
 * Después de un cambio se marcan como viejos todos los listados (cualquier filtro) y el detalle:
 * TanStack Query los vuelve a pedir en cuanto una pantalla los muestre.
 */
function invalidarCotizacion(clienteQuery: QueryClient, id?: string) {
  clienteQuery.invalidateQueries({ queryKey: ['cotizaciones'] });
  if (id) {
    clienteQuery.invalidateQueries({ queryKey: claveCotizacion(id) });
  }
}

/**
 * Listado de cotizaciones del rol con filtros (RF-19 para el personal, RF-20 para el cliente).
 * networkMode 'always': sin conexión falla enseguida (en vez de quedar en pausa) y la pantalla
 * muestra la caché con aviso o el error con Reintentar.
 */
export function useCotizaciones(
  filtros: FiltrosCotizaciones = {},
): ConsultaConConexion<CotizacionSegunRol[]> {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const consulta = useQuery<CotizacionSegunRol[], ErrorApi>({
    queryKey: claveCotizaciones(filtros),
    queryFn: () => listarCotizaciones(filtros),
    enabled: hayUsuario,
    staleTime: STALE_TIME_COTIZACIONES_MS,
    gcTime: GC_TIME_COTIZACIONES_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/**
 * Detalle de una cotización (RF-21). data es null si no existe o es de otro cliente:
 * la pantalla muestra "Cotización no encontrada". Recibe el id de la ruta /cotizacion/[id].
 */
export function useCotizacion(
  id: string | undefined,
): ConsultaConConexion<CotizacionSegunRol | null> {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const consulta = useQuery<CotizacionSegunRol | null, ErrorApi>({
    queryKey: claveCotizacion(id),
    // enabled garantiza que id existe cuando se ejecuta.
    queryFn: () => obtenerCotizacion(id ?? ''),
    enabled: hayUsuario && id !== undefined && id.length > 0,
    staleTime: STALE_TIME_COTIZACIONES_MS,
    gcTime: GC_TIME_COTIZACIONES_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/*
 * Mutaciones. networkMode 'always': sin conexión la petición falla enseguida con "sin_conexion"
 * y la pantalla lo informa; nunca se confirma sin respuesta del servidor (RNF-08). No se repiten
 * solas (queryClient: retry 0): el usuario pulsa Reintentar cuando vuelve la conexión.
 */

/** El cliente envía su solicitud (RF-15). */
export function useCrearSolicitudCotizacion() {
  const clienteQuery = useQueryClient();
  return useMutation<SolicitudCreada, ErrorApi, DatosSolicitudCotizacion>({
    mutationFn: crearSolicitudCotizacion,
    networkMode: 'always',
    onSuccess: (solicitud) => invalidarCotizacion(clienteQuery, solicitud.id),
  });
}

/**
 * El personal guarda una cotización como borrador (RF-16, RF-17) con la RPC de la migración 006.
 * Devuelve el id, el número y el total del servidor.
 */
export function useGuardarBorradorCotizacion() {
  const clienteQuery = useQueryClient();
  return useMutation<CotizacionGuardada, ErrorApi, DatosBorradorCotizacion>({
    mutationFn: guardarBorradorCotizacion,
    networkMode: 'always',
    onSuccess: (guardada) => invalidarCotizacion(clienteQuery, guardada.id),
  });
}

/** El personal envía al cliente un borrador ya guardado (RF-18). Recibe el id. */
export function useEnviarCotizacion() {
  const clienteQuery = useQueryClient();
  return useMutation<CotizacionGuardada, ErrorApi, string>({
    mutationFn: enviarCotizacion,
    networkMode: 'always',
    onSuccess: (_enviada, id) => invalidarCotizacion(clienteQuery, id),
  });
}

/** El cliente abre el detalle: Nueva → Vista (RF-21). Recibe el id. */
export function useMarcarCotizacionVista() {
  const clienteQuery = useQueryClient();
  return useMutation<void, ErrorApi, string>({
    mutationFn: marcarCotizacionVista,
    networkMode: 'always',
    onSuccess: (_resultado, id) => invalidarCotizacion(clienteQuery, id),
  });
}

/**
 * El cliente acepta la cotización y se crea el pedido (RF-22). Recibe el id.
 * También cambian el inventario y los pedidos, así que se marcan esas consultas como viejas.
 */
export function useAceptarCotizacion() {
  const clienteQuery = useQueryClient();
  return useMutation<PedidoCreado, ErrorApi, string>({
    mutationFn: aceptarCotizacion,
    networkMode: 'always',
    onSuccess: (_pedido, id) => {
      invalidarCotizacion(clienteQuery, id);
      clienteQuery.invalidateQueries({ queryKey: ['productos'] });
      clienteQuery.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });
}

/** El cliente rechaza la cotización (RF-22). Recibe el id. */
export function useRechazarCotizacion() {
  const clienteQuery = useQueryClient();
  return useMutation<void, ErrorApi, string>({
    mutationFn: rechazarCotizacion,
    networkMode: 'always',
    onSuccess: (_resultado, id) => invalidarCotizacion(clienteQuery, id),
  });
}
