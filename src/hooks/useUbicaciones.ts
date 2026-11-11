import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  crearUbicacion,
  listarTodasLasUbicaciones,
  listarUbicacionesCliente,
} from '../services/ubicaciones.service';
import { useSesionStore } from '../store/sesionStore';
import { useEnLinea } from './useEnLinea';
import type { DatosUbicacion, Ubicacion } from '../models/Ubicacion';
import type { ErrorApi } from '../types/api.types';
import { conAvisoDeConexion, debeReintentar, type ConsultaConConexion } from '../utils/consultas';

/**
 * Tiempos de caché de las ubicaciones (RNF-03): cambian poco.
 * - staleTime 2 min: volver a la lista o al mapa no repite la petición.
 * - gcTime 10 min: sin conexión se muestra la última lista con el aviso.
 */
const STALE_TIME_UBICACIONES_MS = 2 * 60 * 1000;
const GC_TIME_UBICACIONES_MS = 10 * 60 * 1000;

/** queryKey de las ubicaciones de un cliente. */
export function claveUbicacionesCliente(clienteId: string | null) {
  return ['ubicaciones', 'cliente', clienteId] as const;
}

/** queryKey de todas las ubicaciones (personal). */
export const CLAVE_TODAS_LAS_UBICACIONES = ['ubicaciones', 'todas'] as const;

/**
 * Ubicaciones de servicio de un cliente (Mis ubicaciones y el mapa del cliente).
 * clienteId null (por ejemplo, una cuenta sin ficha de cliente): la consulta no se hace.
 */
export function useUbicacionesCliente(clienteId: string | null): ConsultaConConexion<Ubicacion[]> {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const consulta = useQuery<Ubicacion[], ErrorApi>({
    queryKey: claveUbicacionesCliente(clienteId),
    queryFn: () => listarUbicacionesCliente(clienteId ?? ''),
    enabled: hayUsuario && clienteId !== null,
    staleTime: STALE_TIME_UBICACIONES_MS,
    gcTime: GC_TIME_UBICACIONES_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/**
 * Todas las ubicaciones de servicio, para el trabajador y el administrador (Ubicaciones y mapa).
 * enabled false evita pedirlas cuando la pantalla la abre un cliente.
 */
export function useTodasLasUbicaciones(enabled = true): ConsultaConConexion<Ubicacion[]> {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const consulta = useQuery<Ubicacion[], ErrorApi>({
    queryKey: CLAVE_TODAS_LAS_UBICACIONES,
    queryFn: listarTodasLasUbicaciones,
    enabled: hayUsuario && enabled,
    staleTime: STALE_TIME_UBICACIONES_MS,
    gcTime: GC_TIME_UBICACIONES_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/**
 * Las ubicaciones que corresponden a quien tiene la sesión: las propias para un cliente y todas
 * para el personal. La usa el Mapa, que comparten los tres roles.
 */
export function useUbicacionesSegunRol(): ConsultaConConexion<Ubicacion[]> {
  const usuario = useSesionStore((estado) => estado.usuario);
  const esCliente = usuario?.rol === 'cliente';
  // Los dos hooks se llaman siempre (regla de los hooks); cada uno solo pide si le corresponde.
  const propias = useUbicacionesCliente(esCliente ? (usuario?.clienteId ?? null) : null);
  const todas = useTodasLasUbicaciones(!esCliente);
  return esCliente ? propias : todas;
}

/**
 * Registra una ubicación (RF-26). Al responder el servidor se vuelven a pedir las listas para que
 * aparezca con su marcador. networkMode 'always': sin conexión falla enseguida y no se confirma
 * nada (RNF-08).
 */
export function useCrearUbicacion() {
  const clienteQuery = useQueryClient();
  return useMutation<Ubicacion, ErrorApi, DatosUbicacion>({
    mutationFn: crearUbicacion,
    networkMode: 'always',
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['ubicaciones'] });
    },
  });
}
