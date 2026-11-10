/**
 * Valores con los que la app y el servidor calculan totales y vigencias (sección 5).
 * Viven en la tabla parametros_negocio de Supabase; hoy son valores de prueba
 * [Por confirmar con el cliente] (RF-12, RF-18).
 */
export interface ParametrosNegocio {
  /** IVA en porcentaje, por ejemplo 19. Se aplica sobre (subtotal − descuento). */
  impuestoPorcentaje: number;
  /** Tarifa del servicio de instalación en pesos. */
  tarifaInstalacion: number;
  /** Tarifa del servicio de mantenimiento en pesos. */
  tarifaMantenimiento: number;
  /** Días de vigencia de una cotización enviada. */
  vigenciaDias: number;
}
