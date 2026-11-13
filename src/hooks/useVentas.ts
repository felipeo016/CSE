import { useQuery } from '@tanstack/react-query';

import { obtenerVentasDelMes } from '../services/ventas.service';
import { useSesionStore } from '../store/sesionStore';
import { useEnLinea } from './useEnLinea';
import type { ResumenVentas } from '../models/Ventas';
import type { ErrorApi } from '../types/api.types';
import { conAvisoDeConexion, debeReintentar, type ConsultaConConexion } from '../utils/consultas';

/**
 * Tiempos de caché del panel (RNF-03):
 * - staleTime 1 min: cambiar de mes y volver no repite la petición enseguida; deslizar para
 *   recargar siempre la pide (por si entró una venta).
 * - gcTime 10 min: sin conexión se muestra el último resultado con el aviso.
 */
const STALE_TIME_VENTAS_MS = 60 * 1000;
const GC_TIME_VENTAS_MS = 10 * 60 * 1000;

/** queryKey: uno por mes ("AAAA-MM"). */
export function claveVentas(mes: string) {
  return ['ventas', mes] as const;
}

/**
 * Ventas y ganancias de un mes (Panel general, RF-35). Solo se pide si la sesión es de un
 * administrador. Cada mes tiene su propia queryKey: al cambiar a un mes que no está en caché se
 * muestra la carga (nunca las cifras de otro mes con el nombre del mes nuevo).
 */
export function useVentasDelMes(mes: string): ConsultaConConexion<ResumenVentas> {
  const esAdministrador = useSesionStore((estado) => estado.usuario?.rol === 'administrador');
  const enLinea = useEnLinea();
  const consulta = useQuery<ResumenVentas, ErrorApi>({
    queryKey: claveVentas(mes),
    queryFn: () => obtenerVentasDelMes(mes),
    enabled: esAdministrador,
    staleTime: STALE_TIME_VENTAS_MS,
    gcTime: GC_TIME_VENTAS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}
