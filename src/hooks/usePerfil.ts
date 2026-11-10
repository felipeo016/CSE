import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { actualizarPerfil, obtenerPerfilActual } from '../services/auth.service';
import { useSesionStore } from '../store/sesionStore';
import type { DatosPerfilEditables, Usuario } from '../models/Usuario';
import type { ErrorApi } from '../types/api.types';

/** queryKey del perfil: uno por usuario, para no mezclar datos si cambia la cuenta. */
export function clavePerfil(usuarioId: string | undefined) {
  return ['perfil', usuarioId] as const;
}

/** Consulta los datos de la cuenta con TanStack Query (carga, error y reintento). */
export function usePerfil() {
  const usuarioId = useSesionStore((estado) => estado.usuario?.id);
  return useQuery<Usuario, ErrorApi>({
    queryKey: clavePerfil(usuarioId),
    queryFn: obtenerPerfilActual,
    enabled: usuarioId !== undefined,
    staleTime: 5 * 60 * 1000, // el perfil cambia poco: 5 minutos fresco
    gcTime: 10 * 60 * 1000,
  });
}

/** Guarda nombre y teléfono. Al responder el servidor, la caché queda con los datos nuevos. */
export function useActualizarPerfil() {
  const clienteQuery = useQueryClient();
  return useMutation<Usuario, ErrorApi, DatosPerfilEditables>({
    mutationFn: actualizarPerfil,
    onSuccess: (usuario) => {
      clienteQuery.setQueryData(clavePerfil(usuario.id), usuario);
    },
  });
}
