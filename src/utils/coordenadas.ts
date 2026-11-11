import type { Coordenadas } from '../config/valoresPrueba';

/**
 * true si latitud y longitud son números finitos dentro de los rangos de la Tierra
 * (latitud entre -90 y 90, longitud entre -180 y 180). El mapa solo recibe coordenadas válidas.
 */
export function sonCoordenadasValidas(latitud: unknown, longitud: unknown): boolean {
  return (
    typeof latitud === 'number' &&
    typeof longitud === 'number' &&
    Number.isFinite(latitud) &&
    Number.isFinite(longitud) &&
    Math.abs(latitud) <= 90 &&
    Math.abs(longitud) <= 180
  );
}

/**
 * Convierte dos valores cualesquiera (números o textos de un parámetro de ruta) en Coordenadas.
 * Devuelve null si no son números válidos: así nunca llega al mapa un "abc" o un NaN.
 */
export function aCoordenadas(latitud: unknown, longitud: unknown): Coordenadas | null {
  const lat = aNumero(latitud);
  const lng = aNumero(longitud);
  if (lat === null || lng === null || !sonCoordenadasValidas(lat, lng)) {
    return null;
  }
  return { latitud: lat, longitud: lng };
}

/** Número tal cual, o el número escrito en un texto ("4.81"); null para cualquier otra cosa. */
function aNumero(valor: unknown): number | null {
  if (typeof valor === 'number') {
    return valor;
  }
  if (typeof valor === 'string' && valor.trim() !== '') {
    return Number(valor);
  }
  return null;
}

/** Texto corto para mostrar un punto: "4.81333, -75.69611" (5 decimales ≈ 1 metro). */
export function formatearCoordenadas(punto: Coordenadas): string {
  return `${punto.latitud.toFixed(5)}, ${punto.longitud.toFixed(5)}`;
}
