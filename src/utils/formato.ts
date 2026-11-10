/** Formatos para mostrar datos en pantalla. */

/**
 * Teléfono con espacios para leerlo mejor, como en el mockup: "3001234567" → "300 123 4567".
 * Si no tiene 10 dígitos se muestra tal cual.
 */
export function formatearTelefono(telefono: string): string {
  return /^\d{10}$/.test(telefono)
    ? `${telefono.slice(0, 3)} ${telefono.slice(3, 6)} ${telefono.slice(6)}`
    : telefono;
}
