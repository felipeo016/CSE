import type { ResumenVentas, TotalesVentas, VentaProducto } from '../models/Ventas';

/**
 * Ayudas del Panel general (RF-35): periodo por mes y totales. Son funciones puras para poder
 * explicarlas y probarlas sin la pantalla.
 * Un mes se escribe "AAAA-MM", por ejemplo "2026-11".
 */

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** Mes de una fecha (por defecto hoy, con la hora del teléfono): "2026-11". */
export function mesDe(fecha: Date = new Date()): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

/** Año y mes (1 a 12) de un texto "AAAA-MM". */
function partes(mes: string): { anio: number; numeroMes: number } {
  const [anio, numeroMes] = mes.split('-').map(Number);
  return { anio, numeroMes };
}

/** Suma (o resta, con negativo) meses: sumarMeses("2026-01", -1) → "2025-12". */
export function sumarMeses(mes: string, cantidad: number): string {
  const { anio, numeroMes } = partes(mes);
  return mesDe(new Date(anio, numeroMes - 1 + cantidad, 1));
}

/** Nombre para mostrar: "2026-11" → "noviembre 2026" (mockup: "Resumen de noviembre 2026"). */
export function nombreMes(mes: string): string {
  const { anio, numeroMes } = partes(mes);
  return `${MESES[numeroMes - 1]} ${anio}`;
}

/**
 * Primer y último día del mes, ambos incluidos, como los pide la RPC: "2026-02" →
 * { desde: "2026-02-01", hasta: "2026-02-28" }. new Date(año, mes, 0) es el último día del mes.
 */
export function rangoDelMes(mes: string): { desde: string; hasta: string } {
  const { anio, numeroMes } = partes(mes);
  const ultimoDia = new Date(anio, numeroMes, 0).getDate();
  return { desde: `${mes}-01`, hasta: `${mes}-${String(ultimoDia).padStart(2, '0')}` };
}

/** Totales del periodo. Sin ventas, todo queda en cero (RF-35: cero, no un error). */
export function calcularTotales(productos: VentaProducto[]): TotalesVentas {
  return productos.reduce<TotalesVentas>(
    (suma, venta) => ({
      unidades: suma.unidades + venta.unidadesTotal,
      ventasInstalador: suma.ventasInstalador + venta.ventasInstalador,
      ventasFinal: suma.ventasFinal + venta.ventasFinal,
      ventas: suma.ventas + venta.ventasTotal,
      ganancia: suma.ganancia + venta.ganancia,
      productosVendidos: suma.productosVendidos + (venta.unidadesTotal > 0 ? 1 : 0),
    }),
    { unidades: 0, ventasInstalador: 0, ventasFinal: 0, ventas: 0, ganancia: 0, productosVendidos: 0 },
  );
}

/**
 * La RPC devuelve una fila por producto, también los que no se vendieron (en cero). El panel
 * muestra solo los vendidos, de mayor a menor venta, y los totales de todos.
 */
export function resumirVentas(filas: VentaProducto[]): ResumenVentas {
  const productos = filas
    .filter((venta) => venta.unidadesTotal > 0)
    .sort((a, b) => b.ventasTotal - a.ventasTotal || a.nombre.localeCompare(b.nombre));
  return { productos, totales: calcularTotales(filas) };
}
