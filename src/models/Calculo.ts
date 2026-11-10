/**
 * Tipos del cálculo del total (sección 5, RF-12, RF-17). Los usan src/utils/calculos.ts y el hook
 * useCalculoTotal, compartidos por el carrito (J3) y la cotización (F6).
 */

/** Lo mínimo que necesita el cálculo de cada línea: precio unitario en pesos y cantidad. */
export interface LineaCalculo {
  precio: number;
  cantidad: number;
}

/** Todos los valores del resumen, en pesos. Ninguno es negativo. */
export interface DesgloseTotal {
  /** Suma de precio × cantidad de todas las líneas. */
  subtotal: number;
  /** Descuento aplicado: entre 0 y el subtotal. */
  descuento: number;
  /** subtotal − descuento: la base sobre la que se calcula el impuesto. */
  base: number;
  /** Porcentaje usado, por ejemplo 19, para mostrarlo en el resumen. */
  impuestoPorcentaje: number;
  /** base × porcentaje / 100, redondeado a pesos enteros (igual que el servidor). */
  impuesto: number;
  /** Tarifa de instalación o mantenimiento; 0 si no se pidió servicio. */
  costoServicio: number;
  /** base + impuesto + costoServicio. */
  total: number;
}

/**
 * Resultado de una función de cálculo: o el valor, o la lista de errores en español.
 * Así la pantalla sabe si puede mostrar el total o debe mostrar el mensaje.
 */
export type ResultadoCalculo<T> = { ok: true; valor: T } | { ok: false; errores: string[] };
