import { useQuery } from '@tanstack/react-query';

import { obtenerParametros } from '../services/parametros.service';
import { useSesionStore } from '../store/sesionStore';
import type { ParametrosNegocio } from '../models/ParametrosNegocio';
import type { ErrorApi } from '../types/api.types';
import { debeReintentar } from '../utils/consultas';

/** queryKey de los parámetros del negocio (una sola fila para todos). */
export const CLAVE_PARAMETROS = ['parametros'] as const;

/**
 * IVA, tarifas y vigencia para calcular totales igual que el servidor (sección 5).
 * - staleTime 30 min: estos valores solo cambian desde el panel de Supabase, casi nunca.
 * - gcTime 60 min: se conservan en memoria para no pedirlos en cada cálculo.
 * networkMode 'always': sin conexión y sin caché falla enseguida y el total muestra el error con
 * Reintentar, en vez de quedarse en "Calculando total…" (RNF-02, RNF-08).
 */
export function useParametros() {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  return useQuery<ParametrosNegocio, ErrorApi>({
    queryKey: CLAVE_PARAMETROS,
    queryFn: obtenerParametros,
    enabled: hayUsuario, // sin sesión la base no deja leer la tabla
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: debeReintentar,
    networkMode: 'always',
  });
}
