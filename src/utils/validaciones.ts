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

// Número escrito a mano: dígitos con "-" opcional y, si acaso, hasta dos decimales con punto o
// coma ("79000", "79000,5", "-3"). No pasan "abc", "1e3", "0x10" ni "79.000": Number() los
// aceptaría (como 1000, 16 y 79), pero no son lo que una persona escribe como número.
const FORMATO_NUMERO = /^-?\d+([.,]\d{1,2})?$/;

// Número con puntos de miles: "79.000", "1.250.000".
const FORMATO_PUNTOS_DE_MILES = /^-?\d{1,3}(\.\d{3})+$/;

/** Convierte el texto de un campo numérico ya validado en número ("79000,5" → 79000.5). */
export function textoANumero(valor: string): number {
  return Number(valor.trim().replace(',', '.'));
}

/** Número entero, sin decimales ni texto (por ejemplo, un inventario). */
export function numeroEntero(valor: string): ResultadoValidacion {
  const texto = valor.trim();
  if (!FORMATO_NUMERO.test(texto)) {
    return 'Ingrese un valor numérico';
  }
  return /[.,]/.test(texto) ? 'Ingresa un número entero, sin decimales' : null;
}

/** Número mayor o igual que cero (por ejemplo, un precio o un costo). */
export function numeroNoNegativo(valor: string): ResultadoValidacion {
  const texto = valor.trim();
  if (!FORMATO_NUMERO.test(texto)) {
    return 'Ingrese un valor numérico';
  }
  return textoANumero(texto) < 0 ? 'El valor no puede ser negativo' : null;
}

/** Mayor valor en pesos que acepta la tabla productos (numeric(12, 2)). */
export const VALOR_MAXIMO_PESOS = 9_999_999_999;
/** Mayor inventario que acepta la tabla productos (integer). */
export const INVENTARIO_MAXIMO = 2_147_483_647;

/**
 * Valor en pesos de un producto: costo o precio (RF-29, RNF-15). Obligatorio, numérico (hasta
 * dos decimales) y no negativo. Si se escribe con puntos de miles se explica cómo escribirlo.
 * primerError devuelve el primer mensaje que aparezca, en el orden de la lista.
 */
export function valorEnPesos(valor: string): ResultadoValidacion {
  const texto = valor.trim();
  return primerError(
    FORMATO_PUNTOS_DE_MILES.test(texto) ? 'Escribe el valor sin puntos de miles, por ejemplo 79000' : null,
    numeroNoNegativo(texto),
    textoANumero(texto) > VALOR_MAXIMO_PESOS ? 'El valor es demasiado grande' : null,
  );
}

/** Inventario de un producto (RF-29, RNF-15): obligatorio, entero y no negativo. */
export function inventarioValido(valor: string): ResultadoValidacion {
  const texto = valor.trim();
  // Con texto no numérico textoANumero da NaN y las comparaciones son falsas: queda el mensaje de numeroEntero.
  const numero = textoANumero(texto);
  return primerError(
    numeroEntero(texto),
    numero < 0 ? 'El inventario no puede ser negativo' : null,
    numero > INVENTARIO_MAXIMO ? 'El valor es demasiado grande' : null,
  );
}

/** Dirección de una imagen: opcional, pero si se escribe debe empezar por https://. */
export function urlImagenValida(valor: string): ResultadoValidacion {
  const texto = valor.trim();
  if (texto === '') return null;
  return /^https:\/\/\S+$/i.test(texto) ? null : 'Ingresa una dirección que empiece por https://';
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
