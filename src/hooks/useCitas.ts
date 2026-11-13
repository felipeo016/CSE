import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cambiarEstadoCita,
  crearCita,
  listarCitasCliente,
  listarTodasLasCitas,
} from '../services/citas.service';
import { useSesionStore } from '../store/sesionStore';
import { useEnLinea } from './useEnLinea';
import type { CambioEstadoCita, Cita, DatosCita } from '../models/Cita';
import type { ErrorApi } from '../types/api.types';
import {
  conAvisoDeConexion,
  debeReintentar,
  ERROR_SIN_FICHA_CLIENTE,
  type ConsultaConConexion,
} from '../utils/consultas';

/**
 * Tiempos de caché de las citas (RNF-03):
 * - staleTime 30 s: el trabajador cambia el estado desde otro teléfono; pasados 30 s, volver a la
 *   pantalla la pide de nuevo y deslizar para recargar siempre la pide (RF-28).
 * - gcTime 10 min: sin conexión todavía hay una lista que mostrar con el aviso.
 */
const STALE_TIME_CITAS_MS = 30 * 1000;
const GC_TIME_CITAS_MS = 10 * 60 * 1000;

/** queryKey de las citas de un cliente. Todas empiezan con 'citas' para invalidarlas juntas. */
export function claveCitasCliente(clienteId: string | null) {
  return ['citas', 'cliente', clienteId] as const;
}

/** queryKey de todas las citas (personal). */
export const CLAVE_TODAS_LAS_CITAS = ['citas', 'todas'] as const;

/** Citas del cliente de la sesión (Mis citas e Inicio). */
export function useCitasCliente(): ConsultaConConexion<Cita[]> {
  const clienteId = useSesionStore((estado) => estado.usuario?.clienteId ?? null);
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const consulta = useQuery<Cita[], ErrorApi>({
    queryKey: claveCitasCliente(clienteId),
    // Sin ficha de cliente se responde con un error (no se deja la consulta en espera).
    queryFn: () =>
      clienteId === null ? Promise.reject(ERROR_SIN_FICHA_CLIENTE) : listarCitasCliente(clienteId),
    enabled: hayUsuario,
    staleTime: STALE_TIME_CITAS_MS,
    gcTime: GC_TIME_CITAS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/**
 * Citas de un cliente elegido, para el trabajador y el administrador (historial del Detalle de
 * cliente, RF-33; F8). Mismo servicio y misma queryKey que Mis citas, con el id del cliente.
 */
export function useCitasDeCliente(clienteId: string | undefined): ConsultaConConexion<Cita[]> {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const consulta = useQuery<Cita[], ErrorApi>({
    queryKey: claveCitasCliente(clienteId ?? null),
    queryFn: () => listarCitasCliente(clienteId ?? ''),
    enabled: hayUsuario && clienteId !== undefined && clienteId.length > 0,
    staleTime: STALE_TIME_CITAS_MS,
    gcTime: GC_TIME_CITAS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/** Todas las citas, para el trabajador y el administrador (pestaña Citas, RF-28). */
export function useTodasLasCitas(): ConsultaConConexion<Cita[]> {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const consulta = useQuery<Cita[], ErrorApi>({
    queryKey: CLAVE_TODAS_LAS_CITAS,
    queryFn: listarTodasLasCitas,
    enabled: hayUsuario,
    staleTime: STALE_TIME_CITAS_MS,
    gcTime: GC_TIME_CITAS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/*
 * Mutaciones. networkMode 'always': sin conexión la petición falla enseguida con "sin_conexion"
 * y la pantalla lo informa; nunca se confirma sin respuesta del servidor (RNF-08).
 */

/** El cliente agenda una cita (RF-27). */
export function useCrearCita() {
  const clienteQuery = useQueryClient();
  return useMutation<Cita, ErrorApi, DatosCita>({
    mutationFn: crearCita,
    networkMode: 'always',
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}

/** El trabajador pasa una cita Programada a Realizada o Cancelada (RF-28). */
export function useCambiarEstadoCita() {
  const clienteQuery = useQueryClient();
  return useMutation<Cita, ErrorApi, CambioEstadoCita>({
    mutationFn: cambiarEstadoCita,
    networkMode: 'always',
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
