import type { DesgloseTotal, LineaCalculo, ResultadoCalculo } from '../models/Calculo';
import type { ParametrosNegocio } from '../models/ParametrosNegocio';
import type { TipoServicio } from '../models/Cotizacion';

/**
 * Cálculo del total del carrito y de la cotización (sección 5, RF-12, RF-17).
 * Son funciones puras: reciben números y devuelven un resultado, sin pantallas ni peticiones.
 * Siguen exactamente la fórmula del servidor
 * (supabase/migrations/003_funciones.sql) para que el total de la app sea el mismo:
 *
 *   subtotal = Σ precio × cantidad
 *   base     = subtotal − descuento            (el descuento va de 0 al subtotal)
 *   impuesto = base × IVA / 100, redondeado a pesos enteros
 *   total    = base + impuesto + costo del servicio
 */

export const MENSAJE_VALOR_NUMERICO = 'Ingrese un valor numérico';

/** true si es un número de verdad (no NaN ni Infinity). */
function esNumero(valor: number): boolean {
  return Number.isFinite(valor);
}

/**
 * Convierte el texto de un campo de pesos (por ejemplo el descuento de F6) en número.
 * Solo acepta dígitos, sin puntos ni comas: "20.000" se rechaza para no leerlo como 20.
 */
export function leerMonto(texto: string): ResultadoCalculo<number> {
  const limpio = texto.trim();
  if (!/^-?\d+$/.test(limpio)) {
    return { ok: false, errores: [MENSAJE_VALOR_NUMERICO] };
  }
  const monto = Number(limpio);
  return monto < 0
    ? { ok: false, errores: ['El valor no puede ser negativo'] }
    : { ok: true, valor: monto };
}

/** Subtotal de una línea: precio × cantidad. La cantidad es un entero desde 1. */
export function subtotalLinea(linea: LineaCalculo): ResultadoCalculo<number> {
  if (!esNumero(linea.precio) || !esNumero(linea.cantidad)) {
    return { ok: false, errores: [MENSAJE_VALOR_NUMERICO] };
  }
  if (linea.precio < 0) {
    return { ok: false, errores: ['El precio no puede ser negativo'] };
  }
  if (!Number.isInteger(linea.cantidad) || linea.cantidad < 1) {
    return { ok: false, errores: ['La cantidad debe ser un número entero desde 1'] };
  }
  return { ok: true, valor: linea.precio * linea.cantidad };
}

/** Subtotal general: suma de los subtotales de las líneas. Reúne los errores de todas. */
export function subtotalGeneral(lineas: readonly LineaCalculo[]): ResultadoCalculo<number> {
  let suma = 0;
  const errores: string[] = [];
  for (const linea of lineas) {
    const resultado = subtotalLinea(linea);
    if (resultado.ok) {
      suma += resultado.valor;
    } else {
      errores.push(...resultado.errores);
    }
  }
  // Sin repetir el mismo mensaje si varias líneas fallan igual.
  return errores.length > 0 ? { ok: false, errores: [...new Set(errores)] } : { ok: true, valor: suma };
}

/** El descuento no puede ser negativo ni mayor que el subtotal (sección 5). */
export function validarDescuento(descuento: number, subtotal: number): ResultadoCalculo<number> {
  if (!esNumero(descuento)) {
    return { ok: false, errores: [MENSAJE_VALOR_NUMERICO] };
  }
  if (descuento < 0) {
    return { ok: false, errores: ['El descuento no puede ser negativo'] };
  }
  if (descuento > subtotal) {
    // Mismo texto que responde el servidor.
    return { ok: false, errores: ['El descuento no puede ser mayor que el subtotal'] };
  }
  return { ok: true, valor: descuento };
}

/**
 * Impuesto sobre la base (subtotal − descuento), redondeado a pesos enteros.
 * Con valores no negativos, Math.round redondea igual que round() de PostgreSQL (.5 hacia arriba).
 */
export function calcularImpuesto(base: number, impuestoPorcentaje: number): number {
  return Math.round((Math.max(base, 0) * impuestoPorcentaje) / 100);
}

/** Tarifa del servicio pedido según los parámetros del negocio; 0 si no se pidió servicio. */
export function costoServicio(
  servicio: TipoServicio | null,
  parametros: Pick<ParametrosNegocio, 'tarifaInstalacion' | 'tarifaMantenimiento'>,
): number {
  if (servicio === 'instalacion') {
    return parametros.tarifaInstalacion;
  }
  if (servicio === 'mantenimiento') {
    return parametros.tarifaMantenimiento;
  }
  return 0;
}

/** Datos de entrada del cálculo completo. */
export interface EntradaTotal {
  lineas: readonly LineaCalculo[];
  /** En pesos. En el carrito siempre es 0 (decisión del equipo). */
  descuento: number;
  impuestoPorcentaje: number;
  /** Tarifa del servicio pedido, o 0 (ver costoServicio). */
  costoServicio: number;
}

/**
 * Total completo con todos los valores intermedios. Si algo es inválido devuelve los errores y
 * no un total, para que la pantalla nunca muestre valores negativos ni un descuento imposible.
 */
export function calcularTotal(entrada: EntradaTotal): ResultadoCalculo<DesgloseTotal> {
  const subtotal = subtotalGeneral(entrada.lineas);
  if (!subtotal.ok) {
    return subtotal;
  }

  const descuento = validarDescuento(entrada.descuento, subtotal.valor);
  if (!descuento.ok) {
    return descuento;
  }

  if (!esNumero(entrada.costoServicio) || entrada.costoServicio < 0) {
    return { ok: false, errores: ['El costo del servicio no puede ser negativo'] };
  }
  if (!esNumero(entrada.impuestoPorcentaje) || entrada.impuestoPorcentaje < 0) {
    return { ok: false, errores: ['El porcentaje de impuesto no puede ser negativo'] };
  }

  // Math.max por seguridad: con el descuento ya validado la base nunca queda negativa.
  const base = Math.max(subtotal.valor - descuento.valor, 0);
  const impuesto = calcularImpuesto(base, entrada.impuestoPorcentaje);

  return {
    ok: true,
    valor: {
      subtotal: subtotal.valor,
      descuento: descuento.valor,
      base,
      impuestoPorcentaje: entrada.impuestoPorcentaje,
      impuesto,
      costoServicio: entrada.costoServicio,
      total: base + impuesto + entrada.costoServicio,
    },
  };
}
