import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  crearCliente,
  editarCliente,
  listarClientes,
  obtenerCliente,
} from '../services/clientes.service';
import { useSesionStore } from '../store/sesionStore';
import { useEnLinea } from './useEnLinea';
import type { Cliente, DatosCliente } from '../models/Cliente';
import type { ErrorApi } from '../types/api.types';
import { conAvisoDeConexion, debeReintentar, type ConsultaConConexion } from '../utils/consultas';

/**
 * Tiempos de caché de clientes (RNF-03): cambian poco y solo los edita el personal.
 * - staleTime 2 min: volver a la lista no repite la petición.
 * - gcTime 10 min: sin conexión se muestra la última lista con el aviso.
 */
const STALE_TIME_CLIENTES_MS = 2 * 60 * 1000;
const GC_TIME_CLIENTES_MS = 10 * 60 * 1000;

/** queryKey del listado: uno por texto de búsqueda. */
export function claveClientes(busqueda: string) {
  return ['clientes', busqueda] as const;
}

/** queryKey del detalle. */
export function claveCliente(id: string | undefined) {
  return ['cliente', id] as const;
}

/**
 * Lista de clientes con búsqueda por nombre o teléfono (RF-33).
 * placeholderData: mientras llega el resultado de una búsqueda nueva se sigue mostrando la lista
 * anterior, en lugar de volver al indicador de carga con cada letra.
 */
export function useClientes(busqueda = ''): ConsultaConConexion<Cliente[]> {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const texto = busqueda.trim();
  const consulta = useQuery<Cliente[], ErrorApi>({
    queryKey: claveClientes(texto),
    queryFn: () => listarClientes(texto),
    enabled: hayUsuario,
    staleTime: STALE_TIME_CLIENTES_MS,
    gcTime: GC_TIME_CLIENTES_MS,
    retry: debeReintentar,
    networkMode: 'always',
    placeholderData: keepPreviousData,
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/** Detalle de un cliente. data es null si no existe: la pantalla muestra "Cliente no encontrado". */
export function useCliente(id: string | undefined): ConsultaConConexion<Cliente | null> {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const consulta = useQuery<Cliente | null, ErrorApi>({
    queryKey: claveCliente(id),
    queryFn: () => obtenerCliente(id ?? ''),
    enabled: hayUsuario && id !== undefined && id.length > 0,
    staleTime: STALE_TIME_CLIENTES_MS,
    gcTime: GC_TIME_CLIENTES_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/**
 * Crea un cliente. Al responder el servidor, el detalle queda en caché y las listas (con
 * cualquier búsqueda) se vuelven a pedir para que aparezca el nuevo.
 * networkMode 'always': sin conexión falla enseguida y no se confirma nada (RNF-08).
 */
export function useCrearCliente() {
  const clienteQuery = useQueryClient();
  return useMutation<Cliente, ErrorApi, DatosCliente>({
    mutationFn: crearCliente,
    networkMode: 'always',
    onSuccess: (cliente) => {
      clienteQuery.setQueryData(claveCliente(cliente.id), cliente);
      clienteQuery.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

/** Edita un cliente. Recibe el id y los datos del formulario. */
export function useEditarCliente() {
  const clienteQuery = useQueryClient();
  return useMutation<Cliente, ErrorApi, { id: string; datos: DatosCliente }>({
    mutationFn: ({ id, datos }) => editarCliente(id, datos),
    networkMode: 'always',
    onSuccess: (cliente) => {
      clienteQuery.setQueryData(claveCliente(cliente.id), cliente);
      clienteQuery.invalidateQueries({ queryKey: ['clientes'] });
      // Las cotizaciones del personal muestran el nombre del cliente.
      clienteQuery.invalidateQueries({ queryKey: ['cotizaciones'] });
    },
  });
}
