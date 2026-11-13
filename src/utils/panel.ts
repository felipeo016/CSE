import { UMBRAL_STOCK_BAJO } from '../config/valoresPrueba';
import type { Cita } from '../models/Cita';
import type { CotizacionSegunRol, EstadoCotizacion } from '../models/Cotizacion';
import type { ProductoSegunRol } from '../models/Producto';
import { fechaATexto, hoyTexto, textoAFecha } from './citas';

/**
 * Cálculos de las tarjetas de resumen del Panel general (mockup del administrador). Son funciones
 * puras sobre las listas que ya traen los hooks de Cotizaciones, Citas y Productos.
 */

/** Pendientes: todavía no tienen respuesta del cliente (Solicitada, Borrador, Nueva y Vista). */
const ESTADOS_PENDIENTES: readonly EstadoCotizacion[] = ['solicitada', 'borrador', 'nueva', 'vista'];

/**
 * Cotizaciones pendientes. El estado ya viene calculado por el servidor (estado_actual): una Nueva
 * o Vista con la vigencia vencida llega como Vencida y no se cuenta.
 */
export function contarCotizacionesPendientes(cotizaciones: readonly CotizacionSegunRol[]): number {
  return cotizaciones.filter((cotizacion) => ESTADOS_PENDIENTES.includes(cotizacion.estado)).length;
}

/** Días que cubre "Citas de la semana", contando hoy (hoy y los 6 días siguientes). */
const DIAS_SEMANA_PANEL = 7;

/**
 * Citas de la semana (mockup): programadas desde hoy hasta 6 días después, 7 días en total.
 * Ejemplo: hoy 2026-11-13 → del 2026-11-13 al 2026-11-19. Las de días pasados sin marcar, las
 * realizadas y las canceladas no se cuentan.
 * @param hoy "AAAA-MM-DD"; se recibe como parámetro para poder probar la función.
 */
export function contarCitasDeLaSemana(citas: readonly Cita[], hoy: string = hoyTexto()): number {
  const inicio = textoAFecha(hoy) ?? new Date();
  // new Date(año, mes, día + 6) pasa solo al mes o año siguiente si hace falta.
  const hasta = fechaATexto(
    new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + DIAS_SEMANA_PANEL - 1),
  );
  // "AAAA-MM-DD" se compara bien como texto.
  return citas.filter((cita) => cita.estado === 'programada' && cita.fecha >= hoy && cita.fecha <= hasta)
    .length;
}

/**
 * Productos activos con stock bajo: entre 1 y UMBRAL_STOCK_BAJO unidades (VALOR DE PRUEBA).
 * La lista del personal ya trae solo productos activos.
 */
export function contarStockBajo(productos: readonly ProductoSegunRol[]): number {
  return productos.filter((producto) => producto.inventario >= 1 && producto.inventario <= UMBRAL_STOCK_BAJO)
    .length;
}

/**
 * Tope del eje de la gráfica: un número "redondo" (1, 2, 2,5 o 5 por una potencia de 10) por
 * cada una de las 3 divisiones, mayor o igual que la barra más alta.
 * Ejemplo: máximo 12.450.000 → divisiones de 5.000.000 → tope 15.000.000 (como el mockup).
 */
export function topeDeGrafica(maximo: number): number {
  if (maximo <= 0) return 3;
  const division = maximo / 3;
  const potencia = 10 ** Math.floor(Math.log10(division));
  const paso = [1, 2, 2.5, 5, 10].map((factor) => factor * potencia).find((valor) => valor >= division);
  return (paso ?? 10 * potencia) * 3;
}

/** Pesos abreviados para el eje: 15000000 → "15M", 2500000 → "2,5M", 800000 → "800K". */
export function formatearPesosCorto(valor: number): string {
  const abreviar = (numero: number, sufijo: string) =>
    `${Number(numero.toFixed(1)).toString().replace('.', ',')}${sufijo}`;
  if (valor >= 1_000_000) return abreviar(valor / 1_000_000, 'M');
  if (valor >= 1_000) return abreviar(valor / 1_000, 'K');
  return String(Math.round(valor));
}
