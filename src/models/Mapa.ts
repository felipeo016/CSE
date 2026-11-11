import type { Coordenadas } from '../config/valoresPrueba';

/** Marcador de una ubicación de servicio en el mapa (RF-26). */
export interface PuntoMapa {
  id: string;
  coordenadas: Coordenadas;
  /** Primera línea del globo al tocar el marcador, por ejemplo la dirección. */
  titulo: string;
  /** Segunda línea opcional: referencia o nombre del cliente. */
  detalle?: string;
}

/**
 * Estado del seguimiento de la posición (RF-25):
 * inactivo (nunca se activó o se salió del mapa), activo (el marcador se mueve) o pausado.
 */
export type EstadoSeguimiento = 'inactivo' | 'activo' | 'pausado';

/**
 * Qué está pasando con la ubicación del dispositivo (useUbicacion):
 * - inactivo: aún no se ha pedido la ubicación.
 * - buscando: pidiendo el permiso o esperando al GPS.
 * - lista: ya hay una posición.
 * - sin_permiso: el usuario negó el permiso (CP-02).
 * - gps_apagado: la ubicación del teléfono está desactivada (CP-04).
 * - error: otro fallo (por ejemplo, el GPS no respondió a tiempo).
 */
export type EstadoUbicacion = 'inactivo' | 'buscando' | 'lista' | 'sin_permiso' | 'gps_apagado' | 'error';

/** Mensajes que la app envía a la página del mapa (assets/mapa/leafletHtml.ts). */
export type MensajeHaciaMapa =
  | ({ tipo: 'negocio' } & Coordenadas)
  | ({ tipo: 'dispositivo' } & Coordenadas)
  | { tipo: 'dispositivo'; quitar: true }
  | ({ tipo: 'seleccion' } & Coordenadas)
  | { tipo: 'seleccion'; quitar: true }
  | ({ tipo: 'centrar'; zoom?: number } & Coordenadas)
  | { tipo: 'modoSeleccion'; activo: boolean }
  | {
      tipo: 'ubicaciones';
      puntos: { latitud: number; longitud: number; titulo: string; detalle: string }[];
    };

/** Mensajes que la página del mapa envía a la app. */
export type MensajeDesdeMapa = { tipo: 'listo' } | { tipo: 'error' } | ({ tipo: 'punto' } & Coordenadas);
