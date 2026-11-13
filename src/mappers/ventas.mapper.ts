import type { VentaProductoApi } from '../types/api.types';
import type { VentaProducto } from '../models/Ventas';

/**
 * Número seguro: PostgREST manda numeric y bigint como números, pero si alguno llegara como texto
 * o vacío se convierte, y lo que no sea un número queda en 0 (nunca NaN en pantalla).
 */
function numero(valor: number | string | null | undefined): number {
  const convertido = Number(valor ?? 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

/** Fila de ventas_y_ganancias (snake_case) → VentaProducto. */
export function mapearVentaProducto(fila: VentaProductoApi): VentaProducto {
  return {
    productoId: fila.producto_id,
    codigo: fila.codigo?.trim() || null,
    nombre: fila.nombre.trim(),
    unidadesInstalador: numero(fila.unidades_instalador),
    ventasInstalador: numero(fila.ventas_instalador),
    unidadesFinal: numero(fila.unidades_final),
    ventasFinal: numero(fila.ventas_final),
    unidadesTotal: numero(fila.unidades_total),
    ventasTotal: numero(fila.ventas_total),
    ganancia: numero(fila.ganancia),
  };
}
