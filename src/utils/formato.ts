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
