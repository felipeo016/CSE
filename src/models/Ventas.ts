/**
 * Ventas y ganancias de un producto en un periodo (RF-35). Solo las ve el administrador: el
 * cliente nunca recibe costo ni ganancia (RNF-06).
 */
export interface VentaProducto {
  productoId: string;
  codigo: string | null;
  nombre: string;
  unidadesInstalador: number;
  ventasInstalador: number;
  unidadesFinal: number;
  ventasFinal: number;
  unidadesTotal: number;
  ventasTotal: number;
  /** (precio de venta − costo guardado al vender) × unidades. */
  ganancia: number;
}

/** Totales del periodo que van arriba del Panel general. */
export interface TotalesVentas {
  unidades: number;
  ventasInstalador: number;
  ventasFinal: number;
  ventas: number;
  ganancia: number;
  /** Cuántos productos distintos se vendieron. */
  productosVendidos: number;
}

/** Resultado del periodo: productos con ventas (de mayor a menor) y sus totales. */
export interface ResumenVentas {
  productos: VentaProducto[];
  totales: TotalesVentas;
}
