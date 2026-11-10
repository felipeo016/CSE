import type { ParametrosNegocioApi } from '../types/api.types';
import type { ParametrosNegocio } from '../models/ParametrosNegocio';

/** Convierte la fila de parametros_negocio en el modelo de la app. */
export function mapearParametros(fila: ParametrosNegocioApi): ParametrosNegocio {
  return {
    impuestoPorcentaje: Number(fila.impuesto_porcentaje),
    tarifaInstalacion: Number(fila.tarifa_instalacion),
    tarifaMantenimiento: Number(fila.tarifa_mantenimiento),
    vigenciaDias: Number(fila.vigencia_dias),
  };
}
