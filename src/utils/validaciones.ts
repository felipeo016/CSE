import { esDiaDeAtencion, hoyTexto, textoAFecha, textoDiasAtencion } from './citas';

/**
 * Validaciones de formularios. Son funciones puras: reciben el texto del campo y devuelven
 * el mensaje de error en español, o null si el valor es válido.
 */

/** Resultado de una validación: el mensaje de error o null si el valor es válido. */
export type ResultadoValidacion = string | null;

/** Mínimo de caracteres de la contraseña: es el mínimo que exige Supabase Auth por defecto. */
export const LONGITUD_MINIMA_CONTRASENA = 6;

/** Dígitos que acepta el servidor para el teléfono (docs/servicio-remoto.md, registro). */
export const DIGITOS_MINIMOS_TELEFONO = 7;
export const DIGITOS_MAXIMOS_TELEFONO = 15;

// Formato básico de correo: texto@texto.dominio, sin espacios.
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * El campo no puede quedar vacío (los espacios solos cuentan como vacío).
 * @param campo cómo se nombra el campo en el mensaje, por ejemplo "tu correo electrónico".
 */
export function requerido(valor: string, campo: string): ResultadoValidacion {
  return valor.trim() === '' ? `Ingresa ${campo}` : null;
}

/** Correo con formato nombre@dominio.com. Indica el formato esperado si no lo cumple. */
export function correoValido(valor: string): ResultadoValidacion {
  return FORMATO_CORREO.test(valor.trim())
    ? null
    : 'Ingresa un correo con el formato nombre@dominio.com';
}

/** Teléfono solo con números (se permiten espacios para separar) y de 7 a 15 dígitos. */
export function telefonoValido(valor: string): ResultadoValidacion {
  const digitos = valor.replace(/\s/g, '');
  if (!/^\d+$/.test(digitos)) {
    return 'El teléfono solo debe contener números';
  }
  if (digitos.length < DIGITOS_MINIMOS_TELEFONO || digitos.length > DIGITOS_MAXIMOS_TELEFONO) {
    return `El teléfono debe tener entre ${DIGITOS_MINIMOS_TELEFONO} y ${DIGITOS_MAXIMOS_TELEFONO} dígitos`;
  }
  return null;
}

/** Contraseña con el mínimo de caracteres. */
export function contrasenaMinima(valor: string): ResultadoValidacion {
  return valor.length < LONGITUD_MINIMA_CONTRASENA
    ? `La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres`
    : null;
}

/** Número entero, sin decimales ni texto (por ejemplo, una cantidad). */
export function numeroEntero(valor: string): ResultadoValidacion {
  const texto = valor.trim();
  if (texto === '' || Number.isNaN(Number(texto))) {
    return 'Ingrese un valor numérico';
  }
  return Number.isInteger(Number(texto)) ? null : 'Ingresa un número entero, sin decimales';
}

/** Número mayor o igual que cero (por ejemplo, un precio o un inventario). */
export function numeroNoNegativo(valor: string): ResultadoValidacion {
  const texto = valor.trim();
  if (texto === '' || Number.isNaN(Number(texto))) {
    return 'Ingrese un valor numérico';
  }
  return Number(texto) < 0 ? 'El valor no puede ser negativo' : null;
}

/** Texto exacto de RF-10 cuando se pide más de lo que hay en inventario. */
export function mensajeInventario(disponibles: number): string {
  return `Solo hay ${disponibles} unidades disponibles`;
}

/**
 * Cantidad escrita a mano en el carrito o en la cotización (sección 5, RF-10, RF-16):
 * entero entre 1 y las unidades disponibles. Rechaza vacío, texto, decimales y negativos.
 */
export function cantidadValida(valor: string, disponibles: number): ResultadoValidacion {
  const texto = valor.trim();
  // Dígitos con un "-" opcional (para dar el mensaje de mínimo) y, si acaso, una parte decimal con
  // punto o coma. "1e2" o "abc" no pasan; "2,5" o "1.5" sí pasan y abajo reciben el mensaje de decimales.
  if (!/^-?\d+([.,]\d+)?$/.test(texto)) {
    return 'Ingrese un valor numérico';
  }
  if (/[.,]/.test(texto)) {
    return 'Ingresa un número entero, sin decimales';
  }
  const cantidad = Number(texto);
  if (cantidad < 1) {
    return 'La cantidad mínima es 1';
  }
  return cantidad > disponibles ? mensajeInventario(disponibles) : null;
}

/**
 * Devuelve el primer error de una lista de validaciones, o null si todas pasan.
 * Ejemplo: primerError(requerido(correo, 'tu correo electrónico'), correoValido(correo)).
 */
export function primerError(...resultados: ResultadoValidacion[]): ResultadoValidacion {
  return resultados.find((resultado) => resultado !== null) ?? null;
}

/**
 * Fecha de una cita (RF-27, sección 5): obligatoria, de hoy en adelante y en un día de atención
 * (valoresPrueba). El servidor vuelve a rechazar las fechas pasadas.
 * @param fecha "AAAA-MM-DD" o null si aún no se elige.
 * @param hoy "AAAA-MM-DD" del teléfono; se recibe como parámetro para poder probar la función.
 */
export function fechaCitaValida(fecha: string | null, hoy: string = hoyTexto()): ResultadoValidacion {
  if (fecha === null) {
    return 'Elige la fecha de la cita';
  }
  const dia = textoAFecha(fecha);
  if (!dia) {
    return 'Elige una fecha válida';
  }
  // "AAAA-MM-DD" se compara como texto: "2026-11-11" < "2026-11-12".
  if (fecha < hoy) {
    return 'La fecha de la cita no puede ser pasada';
  }
  if (!esDiaDeAtencion(dia)) {
    return `Ese día no hay atención. Elige un día de ${textoDiasAtencion()}`;
  }
  return null;
}
