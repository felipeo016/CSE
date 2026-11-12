import type { Coordenadas } from '../config/valoresPrueba';

/**
 * Ubicación de servicio: el lugar de instalación o mantenimiento de un cliente (RF-26).
 * La ve ese cliente, los trabajadores y el administrador (RNF-13).
 */
export interface Ubicacion {
  id: string;
  clienteId: string;
  /** Nombre del cliente; null si el servidor no lo envió. */
  clienteNombre: string | null;
  coordenadas: Coordenadas;
  direccion: string;
  /** Indicaciones para llegar ("Casa esquinera, portón negro"); null si no hay. */
  referencia: string | null;
  /** Fecha de registro en formato ISO. */
  creadaEn: string;
}

/** Datos del formulario Registrar ubicación, ya validados. */
export interface DatosUbicacion {
  clienteId: string;
  coordenadas: Coordenadas;
  direccion: string;
  /** Texto libre; vacío = sin referencia. */
  referencia: string;
}
