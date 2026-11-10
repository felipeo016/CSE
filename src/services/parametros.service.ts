import { api } from './api';
import { mapearParametros } from '../mappers/parametros.mapper';
import type { ErrorApi, ParametrosNegocioApi } from '../types/api.types';
import type { ParametrosNegocio } from '../models/ParametrosNegocio';

/**
 * Lee los parámetros del negocio: IVA, tarifas de instalación y mantenimiento y vigencia de la
 * cotización. La tabla tiene una sola fila (id = 1) y cualquier usuario con sesión puede leerla.
 */
export async function obtenerParametros(): Promise<ParametrosNegocio> {
  const respuesta = await api.get<ParametrosNegocioApi[]>('/rest/v1/parametros_negocio', {
    params: { select: '*', id: 'eq.1' },
  });
  const fila = respuesta.data[0];
  if (!fila) {
    // Solo pasa si la base no se montó completa (falta la fila de 001_esquema.sql).
    const error: ErrorApi = {
      tipo: 'servidor',
      mensaje: 'No se encontraron los parámetros del negocio. Intenta más tarde.',
    };
    throw error;
  }
  return mapearParametros(fila);
}
