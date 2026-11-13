import { api } from './api';
import { mapearVentaProducto } from '../mappers/ventas.mapper';
import type { ResumenVentas } from '../models/Ventas';
import type { VentaProductoApi, VentasCuerpoApi } from '../types/api.types';
import { rangoDelMes, resumirVentas } from '../utils/ventas';

/**
 * Ventas y ganancias del Panel general (RF-35) con la RPC ventas_y_ganancias. Solo responde al
 * administrador: a cualquier otro rol el servidor le contesta "Acceso no autorizado" (RNF-06).
 * Desde la migración 009 la ganancia usa el costo guardado al momento de cada venta.
 */
export async function obtenerVentasDelMes(mes: string): Promise<ResumenVentas> {
  const cuerpo: VentasCuerpoApi = rangoDelMes(mes);
  const respuesta = await api.post<VentaProductoApi[]>('/rest/v1/rpc/ventas_y_ganancias', cuerpo);
  return resumirVentas(respuesta.data.map(mapearVentaProducto));
}
