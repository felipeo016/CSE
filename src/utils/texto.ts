/**
 * Texto en minúsculas y sin tildes, para buscar sin distinguir mayúsculas ni tildes:
 * "Cámara" y "camara" quedan iguales.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita las marcas de tilde que separa normalize('NFD')
    .toLowerCase()
    .trim();
}
