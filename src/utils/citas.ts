import { DIAS_ATENCION, FRANJAS_HORARIAS, type DiaSemana, type FranjaHoraria } from '../config/valoresPrueba';
import type { Cita } from '../models/Cita';

/**
 * Ayudas de fechas y franjas de las citas (RF-27). La fecha de una cita no tiene hora: se maneja
 * como texto "AAAA-MM-DD" y se arma a mano con la fecha del teléfono. new Date("2026-11-12") la
 * leería como medianoche UTC, que en Colombia es el día anterior.
 */

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Date del teléfono → "AAAA-MM-DD" (con el día local, no el de UTC). */
export function fechaATexto(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Fecha de hoy en el teléfono, "AAAA-MM-DD". */
export function hoyTexto(): string {
  return fechaATexto(new Date());
}

/** "AAAA-MM-DD" → Date a medianoche local; null si el texto no es una fecha válida. */
export function textoAFecha(texto: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) {
    return null;
  }
  const fecha = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
  // Descarta fechas imposibles como 2026-02-31 (Date las pasaría al mes siguiente).
  return fechaATexto(fecha) === texto ? fecha : null;
}

/** "2026-11-12" → "Jue 12 nov 2026", como en el mockup de Agendar cita. */
export function formatearFechaCita(texto: string): string {
  const fecha = textoAFecha(texto);
  if (!fecha) {
    return texto;
  }
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${DIAS_CORTOS[fecha.getDay()]} ${dia} ${MESES_CORTOS[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

/** Franja de valoresPrueba → texto que guarda el servidor: "08:00-10:00". */
export function claveFranja(franja: FranjaHoraria): string {
  return `${franja.inicio}-${franja.fin}`;
}

/**
 * Franja de una cita para hoy: si ya pasó su hora de inicio, no se puede elegir (decisión del
 * equipo). El servidor revisa lo mismo en hora de Colombia (migración 008, hint FRANJA_PASADA)
 * y responde con este mismo texto.
 * Las horas "HH:mm" se comparan como texto: "08:00" < "10:00".
 * @param fecha "AAAA-MM-DD" elegida, o null si aún no se elige.
 * @param franja "HH:mm-HH:mm" elegida, o null si aún no se elige.
 * @param ahora se recibe como parámetro para poder probar la función con cualquier hora.
 * @returns el mensaje de error, o null si la franja sirve (o si falta la fecha o la franja).
 */
export function franjaCitaValida(
  fecha: string | null,
  franja: string | null,
  ahora: Date = new Date(),
): string | null {
  // Solo aplica a las citas de hoy; otro día cualquier franja sirve.
  if (fecha === null || franja === null || fecha !== fechaATexto(ahora)) {
    return null;
  }
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  const inicio = franja.split('-')[0] ?? '';
  return inicio <= horaActual ? 'Esa franja ya pasó. Elige otra franja u otro día' : null;
}

/** "08:00-10:00" → "08:00 – 10:00" para mostrar. */
export function textoFranja(franja: string): string {
  return franja.replace('-', ' – ');
}

/** Franjas de valoresPrueba con su clave y su texto, para el selector de Agendar cita. */
export const OPCIONES_FRANJA = FRANJAS_HORARIAS.map((franja) => ({
  valor: claveFranja(franja),
  etiqueta: textoFranja(claveFranja(franja)),
}));

/** true si ese día de la semana hay atención (valoresPrueba). */
export function esDiaDeAtencion(fecha: Date): boolean {
  return DIAS_ATENCION.includes(fecha.getDay() as DiaSemana);
}

/** "lunes a sábado" a partir de los días de valoresPrueba (para los mensajes). */
export function textoDiasAtencion(): string {
  const dias = [...DIAS_ATENCION].sort((a, b) => a - b);
  const primero = dias[0];
  const ultimo = dias[dias.length - 1];
  if (primero === undefined || ultimo === undefined) {
    return '';
  }
  // Días seguidos: "lunes a sábado"; si no, la lista completa.
  const seguidos = dias.every((dia, i) => dia === primero + i);
  return seguidos
    ? `${DIAS_LARGOS[primero]} a ${DIAS_LARGOS[ultimo]}`
    : dias.map((dia) => DIAS_LARGOS[dia]).join(', ');
}

/**
 * Orden de las listas de citas: primero las Programadas, de la más próxima a la más lejana; luego
 * las demás (Realizadas y Canceladas), de la más reciente a la más antigua.
 * Las fechas "AAAA-MM-DD" y las franjas "HH:mm-HH:mm" se pueden comparar como texto.
 */
export function ordenarCitas(citas: readonly Cita[]): Cita[] {
  const clave = (cita: Cita) => `${cita.fecha} ${cita.franja}`;
  const programadas = citas
    .filter((cita) => cita.estado === 'programada')
    .sort((a, b) => clave(a).localeCompare(clave(b)));
  const otras = citas
    .filter((cita) => cita.estado !== 'programada')
    .sort((a, b) => clave(b).localeCompare(clave(a)));
  return [...programadas, ...otras];
}

/** La próxima cita Programada de hoy en adelante, o null si no hay (Inicio del cliente). */
export function proximaCita(citas: readonly Cita[], hoy: string = hoyTexto()): Cita | null {
  return (
    ordenarCitas(citas).find((cita) => cita.estado === 'programada' && cita.fecha >= hoy) ?? null
  );
}
