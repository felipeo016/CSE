import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import {
  cambiarEstadoUsuario,
  crearUsuario,
  editarUsuario,
  listarUsuarios,
  obtenerUsuario,
} from '../services/usuarios.service';
import { useSesionStore } from '../store/sesionStore';
import { useEnLinea } from './useEnLinea';
import type { DatosUsuarioAdmin, UsuarioAdmin } from '../models/Usuario';
import type { ErrorApi } from '../types/api.types';
import { conAvisoDeConexion, debeReintentar, type ConsultaConConexion } from '../utils/consultas';

/**
 * Tiempos de caché de los usuarios (RNF-03): cambian poco y solo los cambia el administrador.
 * - staleTime 1 min: volver a la lista no repite la petición enseguida.
 * - gcTime 10 min: sin conexión se muestra la última lista con el aviso.
 */
const STALE_TIME_USUARIOS_MS = 60 * 1000;
const GC_TIME_USUARIOS_MS = 10 * 60 * 1000;

/** queryKey de la lista. Todas empiezan con 'usuarios' para invalidarlas juntas. */
export const CLAVE_USUARIOS = ['usuarios', 'lista'] as const;

/** queryKey del detalle (formulario de edición). */
export function claveUsuario(id: string | undefined) {
  return ['usuarios', 'detalle', id] as const;
}

/** Lista de usuarios con su rol y estado (Usuarios y roles, RF-34). */
export function useUsuarios(): ConsultaConConexion<UsuarioAdmin[]> {
  const esAdministrador = useSesionStore((estado) => estado.usuario?.rol === 'administrador');
  const enLinea = useEnLinea();
  const consulta = useQuery<UsuarioAdmin[], ErrorApi>({
    queryKey: CLAVE_USUARIOS,
    queryFn: listarUsuarios,
    enabled: esAdministrador,
    staleTime: STALE_TIME_USUARIOS_MS,
    gcTime: GC_TIME_USUARIOS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/** Un usuario para editarlo. data es null si no existe: la pantalla muestra "Usuario no encontrado". */
export function useUsuario(id: string | undefined): ConsultaConConexion<UsuarioAdmin | null> {
  const esAdministrador = useSesionStore((estado) => estado.usuario?.rol === 'administrador');
  const enLinea = useEnLinea();
  const consulta = useQuery<UsuarioAdmin | null, ErrorApi>({
    queryKey: claveUsuario(id),
    queryFn: () => obtenerUsuario(id ?? ''),
    enabled: esAdministrador && id !== undefined && id.length > 0,
    staleTime: STALE_TIME_USUARIOS_MS,
    gcTime: GC_TIME_USUARIOS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/**
 * Después de guardar: el detalle queda con lo que respondió el servidor y la lista se vuelve a
 * pedir. Crear un cliente o pasar a alguien a cliente puede crear una ficha de cliente, así que
 * también se marca la lista de Clientes.
 * Si el administrador editó su propia cuenta, se actualiza su sesión (nombre del menú lateral).
 */
function alGuardar(clienteQuery: QueryClient, usuario: UsuarioAdmin) {
  clienteQuery.setQueryData(claveUsuario(usuario.id), usuario);
  clienteQuery.invalidateQueries({ queryKey: CLAVE_USUARIOS });
  clienteQuery.invalidateQueries({ queryKey: ['clientes'] });

  const { usuario: sesion, actualizarUsuario } = useSesionStore.getState();
  if (sesion && sesion.id === usuario.id) {
    actualizarUsuario({ ...sesion, nombre: usuario.nombre, telefono: usuario.telefono });
  }
}

/*
 * Mutaciones. networkMode 'always': sin conexión fallan enseguida con "sin_conexion" y la
 * pantalla lo informa; nunca se confirma sin respuesta del servidor (RNF-08). No se repiten solas
 * (queryClient: retry 0) para no crear un usuario dos veces.
 */

export function useCrearUsuario() {
  const clienteQuery = useQueryClient();
  return useMutation<UsuarioAdmin, ErrorApi, DatosUsuarioAdmin>({
    mutationFn: crearUsuario,
    networkMode: 'always',
    onSuccess: (usuario) => alGuardar(clienteQuery, usuario),
  });
}

export function useEditarUsuario() {
  const clienteQuery = useQueryClient();
  return useMutation<UsuarioAdmin, ErrorApi, { id: string; datos: DatosUsuarioAdmin }>({
    mutationFn: ({ id, datos }) => editarUsuario(id, datos),
    networkMode: 'always',
    onSuccess: (usuario) => alGuardar(clienteQuery, usuario),
  });
}

export function useCambiarEstadoUsuario() {
  const clienteQuery = useQueryClient();
  return useMutation<UsuarioAdmin, ErrorApi, { id: string; activo: boolean }>({
    mutationFn: ({ id, activo }) => cambiarEstadoUsuario(id, activo),
    networkMode: 'always',
    onSuccess: (usuario) => alGuardar(clienteQuery, usuario),
  });
}
