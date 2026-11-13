import type { TipoServicio } from './Cotizacion';

/**
 * Cita de instalación o mantenimiento (RF-27, RF-28, sección 5).
 * Se crea como Programada y solo el trabajador la cambia a Realizada o Cancelada.
 */
export type EstadoCita = 'programada' | 'realizada' | 'cancelada';

export const NOMBRE_ESTADO_CITA: Record<EstadoCita, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

/** Estados a los que el trabajador puede pasar una cita Programada. */
export type EstadoFinalCita = Exclude<EstadoCita, 'programada'>;

export interface Cita {
  id: string;
  clienteId: string;
  /** Nombre del cliente; null si el servidor no lo envió. */
  clienteNombre: string | null;
  tipo: TipoServicio;
  tipoNombre: string;
  /** Fecha sin hora, "AAAA-MM-DD". */
  fecha: string;
  /** Franja como la guarda el servidor: "08:00-10:00". */
  franja: string;
  /** Franja para mostrar: "08:00 – 10:00". */
  franjaTexto: string;
  ubicacionId: string;
  /** Dirección de la ubicación; null si el servidor no la envió. */
  direccion: string | null;
  referencia: string | null;
  pedidoId: string | null;
  pedidoNumero: string | null;
  estado: EstadoCita;
  estadoNombre: string;
  creadoEn: string;
}

/** Datos del formulario Agendar cita, ya validados. */
export interface DatosCita {
  clienteId: string;
  tipo: TipoServicio;
  /** "AAAA-MM-DD". */
  fecha: string;
  /** "HH:mm-HH:mm". */
  franja: string;
  ubicacionId: string;
  /** Pedido asociado (opcional, solo instalación). */
  pedidoId: string | null;
}

/** Filtro de la lista de citas del trabajador. */
export type FiltroEstadoCita = EstadoCita | 'todas';

/** Datos para cambiar el estado de una cita. */
export interface CambioEstadoCita {
  id: string;
  estado: EstadoFinalCita;
}
