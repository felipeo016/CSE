/** Marca de un producto (RF-05). */
export type Marca = 'Hikvision' | 'EZVIZ' | 'HiLook';

/** Código de categoría (RF-07). Se usa para filtrar; en pantalla se muestra su nombre legible. */
export type Categoria =
  | 'dvr'
  | 'camaras_turbo_hd'
  | 'camaras_wifi_ip'
  | 'kits'
  | 'alarmas_sensores'
  | 'discos_duros'
  | 'fuentes_ups'
  | 'accesorios_cableado';

/** Tipo de comprador. Cada cliente ve y paga el precio de su tipo (decisión del equipo). */
export type TipoCliente = 'instalador' | 'final';

/** Nombre visible de cada categoría, en el orden de RF-07. */
export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  dvr: 'DVR',
  camaras_turbo_hd: 'Cámaras Turbo HD',
  camaras_wifi_ip: 'Cámaras WiFi e IP',
  kits: 'Kits',
  alarmas_sensores: 'Alarmas y sensores',
  discos_duros: 'Discos duros',
  fuentes_ups: 'Fuentes y UPS',
  accesorios_cableado: 'Accesorios de cableado',
};

/** Nombre visible de cada marca. */
export const NOMBRE_MARCA: Record<Marca, string> = {
  Hikvision: 'Hikvision',
  EZVIZ: 'EZVIZ',
  HiLook: 'HiLook',
};

/**
 * Producto como lo ve el cliente (catálogo y detalle).
 * No tiene costo ni ganancia (RNF-06): ni siquiera existe el campo.
 */
export interface Producto {
  id: string;
  /** null cuando el producto no tiene código (se permite con advertencia). */
  codigo: string | null;
  nombre: string;
  /** Texto vacío si el producto no tiene descripción. */
  descripcion: string;
  marca: Marca;
  marcaNombre: string;
  categoria: Categoria;
  categoriaNombre: string;
  /** Precio en pesos del tipo indicado en tipoPrecio; null si no está registrado. */
  precio: number | null;
  /** De qué tipo es el precio de arriba (instalador o final). */
  tipoPrecio: TipoCliente;
  inventario: number;
  /** true si hay al menos una unidad. Si es false, la pantalla muestra "Agotado". */
  disponible: boolean;
  /** null si no tiene imagen: la pantalla usa assets/images/producto-sin-imagen.png. */
  imagenUrl: string | null;
}

/**
 * Producto como lo ve el personal (trabajador y administrador): agrega el costo y los dos precios.
 * Su "precio" es el de cliente final, el mismo que ve el personal en el catálogo.
 */
export interface ProductoPersonal extends Producto {
  costo: number;
  precioInstalador: number | null;
  precioClienteFinal: number;
}

/** Lo que devuelven las consultas de productos: depende del rol de la sesión. */
export type ProductoSegunRol = Producto | ProductoPersonal;

/** Indica si un producto trae los datos del personal (costo y los dos precios). */
export function esProductoPersonal(producto: ProductoSegunRol): producto is ProductoPersonal {
  return 'costo' in producto;
}
