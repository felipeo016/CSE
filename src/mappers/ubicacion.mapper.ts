import type { UbicacionApi } from '../types/api.types';
import type { Ubicacion } from '../models/Ubicacion';
import { aCoordenadas } from '../utils/coordenadas';

/**
 * Fila de la tabla ubicaciones (snake_case) → Ubicacion.
 * Devuelve null si las coordenadas no son números válidos: esa fila no se muestra ni llega al mapa.
 */
export function mapearUbicacion(fila: UbicacionApi): Ubicacion | null {
  const coordenadas = aCoordenadas(fila.latitud, fila.longitud);
  if (!coordenadas) {
    return null;
  }
  const referencia = fila.referencia?.trim() ?? '';
  return {
    id: fila.id,
    clienteId: fila.cliente_id,
    clienteNombre: fila.cliente?.nombre.trim() ?? null,
    coordenadas,
    direccion: fila.direccion.trim(),
    referencia: referencia.length > 0 ? referencia : null,
    creadaEn: fila.creado_en,
  };
}

/** Lista de filas → ubicaciones válidas (descarta las que tengan coordenadas inválidas). */
export function mapearUbicaciones(filas: UbicacionApi[]): Ubicacion[] {
  return filas
    .map(mapearUbicacion)
    .filter((ubicacion): ubicacion is Ubicacion => ubicacion !== null);
}
