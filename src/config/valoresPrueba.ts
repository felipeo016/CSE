/**
 * Valores de prueba mientras el cliente confirma los datos reales (documentación, sección 12).
 * Aquí solo van los que no tienen que ver con cobros. IVA, tarifas y vigencia viven en la tabla
 * parametros_negocio de Supabase para que la app y el servidor calculen con los mismos valores.
 */

/** Día de la semana como lo entrega Date.getDay(): 0 = domingo, 1 = lunes ... 6 = sábado. */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Franja horaria de una cita, en formato 24 horas "HH:mm". */
export interface FranjaHoraria {
  inicio: string;
  fin: string;
}

/** Punto geográfico en grados decimales. */
export interface Coordenadas {
  latitud: number;
  longitud: number;
}

// VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-27)
// Días de atención: lunes a sábado.
export const DIAS_ATENCION: readonly DiaSemana[] = [1, 2, 3, 4, 5, 6];

// VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-27)
// Franjas horarias disponibles para agendar una cita.
export const FRANJAS_HORARIAS: readonly FranjaHoraria[] = [
  { inicio: '08:00', fin: '10:00' },
  { inicio: '10:00', fin: '12:00' },
  { inicio: '14:00', fin: '16:00' },
  { inicio: '16:00', fin: '18:00' },
];

// VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-27)
// Cupos por franja: null significa que no hay límite de citas por franja.
export const CUPOS_POR_FRANJA: number | null = null;

// VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-23)
// Coordenadas del negocio (reemplazan las de Dosquebradas del ejercicio de clase).
export const COORDENADAS_NEGOCIO: Coordenadas = {
  latitud: 4.92261613391541,
  longitud: -75.06546509423036,
};

// VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-35)
// Stock bajo en el Panel general: productos activos con 1 a 2 unidades (el mockup no muestra el
// umbral). Los de 0 unidades ya se ven como "Agotado" y no se cuentan aquí.
export const UMBRAL_STOCK_BAJO = 2;
