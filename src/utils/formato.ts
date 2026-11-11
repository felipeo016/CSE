/** Formatos para mostrar datos en pantalla. */

/**
 * Precio en pesos como en el mockup: 79000 → "$ 79.000". Se redondea a pesos enteros y los miles
 * se separan con punto. Se arma a mano para no depender de Intl en el teléfono.
 */
export function formatearPrecio(valor: number): string {
  const entero = Math.round(Math.abs(valor)).toString();
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${valor < 0 ? '− ' : ''}$ ${conPuntos}`;
}

/**
 * Teléfono con espacios para leerlo mejor, como en el mockup: "3001234567" → "300 123 4567".
 * Si no tiene 10 dígitos se muestra tal cual.
 */
export function formatearTelefono(telefono: string): string {
  return /^\d{10}$/.test(telefono)
    ? `${telefono.slice(0, 3)} ${telefono.slice(3, 6)} ${telefono.slice(6)}`
    : telefono;
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Fecha corta como en el mockup de Cotizaciones: "2026-11-04T15:20:00Z" → "04 nov 2026".
 * Usa la hora del teléfono. Se arma a mano para no depender de Intl. Texto vacío si la fecha no es válida.
 */
export function formatearFecha(fechaIso: string | null): string {
  if (!fechaIso) {
    return '';
  }
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${dia} ${MESES_CORTOS[fecha.getMonth()]} ${fecha.getFullYear()}`;
}
