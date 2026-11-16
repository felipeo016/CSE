import { create } from 'zustand';

import type { Coordenadas } from '../config/valoresPrueba';
import type { EstadoSeguimiento } from '../models/Mapa';

/**
 * Store del mapa (RF-24 a RF-26), con el enfoque de useLocationStore de los trabajos de Mapas de la clase.
 * Comparte entre el Mapa y el formulario Registrar ubicación:
 * - el punto elegido en el mapa (el formulario lo lee al volver del mapa),
 * - la ubicación activa del dispositivo,
 * - el estado del seguimiento.
 * Es solo estado local: no se guarda en el teléfono y las ubicaciones del servidor van con
 * TanStack Query (useUbicaciones), nunca aquí.
 */
interface MapaState {
  /** Punto tocado en el mapa en modo "elegir punto"; null si no hay. */
  puntoSeleccionado: Coordenadas | null;
  /** Última posición conocida del teléfono mientras se usa el mapa; null si no hay. */
  ubicacionActiva: Coordenadas | null;
  seguimiento: EstadoSeguimiento;

  elegirPunto: (punto: Coordenadas) => void;
  /** Borra el punto elegido (al empezar un registro nuevo y después de guardarlo). */
  limpiarPunto: () => void;
  actualizarUbicacionActiva: (punto: Coordenadas | null) => void;
  cambiarSeguimiento: (seguimiento: EstadoSeguimiento) => void;
}

export const useMapaStore = create<MapaState>()((set) => ({
  puntoSeleccionado: null,
  ubicacionActiva: null,
  seguimiento: 'inactivo',

  elegirPunto: (punto) => set({ puntoSeleccionado: punto }),
  limpiarPunto: () => set({ puntoSeleccionado: null }),
  actualizarUbicacionActiva: (punto) => set({ ubicacionActiva: punto }),
  cambiarSeguimiento: (seguimiento) => set({ seguimiento }),
}));
