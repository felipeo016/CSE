import type { Categoria, Marca } from '../models/Producto';

/** Una opción de filtro: null = "Todas". */
export interface OpcionFiltro<T extends string> {
  valor: T | null;
  etiqueta: string;
}

/**
 * Chips de categoría del catálogo (RF-07). Usan las etiquetas cortas del mockup y cada una filtra
 * exactamente una de las ocho categorías de RF-07, así todas se pueden filtrar:
 * - "Cámaras" = Cámaras Turbo HD (bala, turret y domo).
 * - "WiFi" = Cámaras WiFi e IP.
 * "Kits", "Discos" y "Fuentes" no aparecen en el mockup y se agregaron con el mismo estilo.
 */
export const FILTROS_CATEGORIA: readonly OpcionFiltro<Categoria>[] = [
  { valor: null, etiqueta: 'Todas' },
  { valor: 'camaras_turbo_hd', etiqueta: 'Cámaras' },
  { valor: 'dvr', etiqueta: 'DVR' },
  { valor: 'camaras_wifi_ip', etiqueta: 'WiFi' },
  { valor: 'kits', etiqueta: 'Kits' },
  { valor: 'alarmas_sensores', etiqueta: 'Alarmas' },
  { valor: 'discos_duros', etiqueta: 'Discos' },
  { valor: 'fuentes_ups', etiqueta: 'Fuentes' },
  { valor: 'accesorios_cableado', etiqueta: 'Accesorios' },
];

/** Chips de marca (RF-07). El mockup no los dibuja: van en una segunda fila con el mismo estilo. */
export const FILTROS_MARCA: readonly OpcionFiltro<Marca>[] = [
  { valor: null, etiqueta: 'Todas las marcas' },
  { valor: 'Hikvision', etiqueta: 'Hikvision' },
  { valor: 'EZVIZ', etiqueta: 'EZVIZ' },
  { valor: 'HiLook', etiqueta: 'HiLook' },
];
