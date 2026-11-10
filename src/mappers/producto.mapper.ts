import type { ProductoCatalogoApi, ProductoPersonalApi } from '../types/api.types';
import {
  NOMBRE_CATEGORIA,
  NOMBRE_MARCA,
  type Producto,
  type ProductoPersonal,
} from '../models/Producto';

/**
 * Convierte las filas de productos del servidor (snake_case) en los modelos de la app.
 * Aquí se normalizan los nulos para que las pantallas no tengan que revisarlos.
 */

/** Texto sin espacios sobrantes, o null si viene vacío. */
function textoONull(valor: string | null): string | null {
  const limpio = valor?.trim() ?? '';
  return limpio.length > 0 ? limpio : null;
}

/** Precio válido (número finito y no negativo) o null. */
function precioONull(valor: number | null): number | null {
  if (valor === null) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

/** El inventario es un entero no negativo; cualquier otro valor se trata como 0. */
function inventarioSeguro(valor: number): number {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : 0;
}

/** Campos comunes a las dos respuestas (vista del cliente y tabla del personal). */
function camposComunes(fila: ProductoCatalogoApi | ProductoPersonalApi) {
  const inventario = inventarioSeguro(fila.inventario);
  return {
    id: fila.id,
    codigo: textoONull(fila.codigo),
    nombre: fila.nombre.trim(),
    descripcion: fila.descripcion?.trim() ?? '',
    marca: fila.marca,
    // Si llegara un valor desconocido se muestra tal cual en lugar de dejar el texto vacío.
    marcaNombre: NOMBRE_MARCA[fila.marca] ?? fila.marca,
    categoria: fila.categoria,
    categoriaNombre: NOMBRE_CATEGORIA[fila.categoria] ?? fila.categoria,
    inventario,
    disponible: inventario > 0,
    imagenUrl: textoONull(fila.imagen_url),
  };
}

/** Fila de la vista productos_catalogo → Producto (cliente). No hay costo que copiar. */
export function mapearProductoCatalogo(fila: ProductoCatalogoApi): Producto {
  return {
    ...camposComunes(fila),
    precio: precioONull(fila.precio),
    tipoPrecio: fila.tipo_precio,
  };
}

/** Fila de la tabla productos → ProductoPersonal (trabajador y administrador). */
export function mapearProductoPersonal(fila: ProductoPersonalApi): ProductoPersonal {
  const precioClienteFinal = precioONull(fila.precio_cliente_final) ?? 0;
  return {
    ...camposComunes(fila),
    // El personal ve como "precio" el de cliente final, igual que en la vista del catálogo.
    precio: precioClienteFinal,
    tipoPrecio: 'final',
    costo: precioONull(fila.costo) ?? 0,
    precioInstalador: precioONull(fila.precio_instalador),
    precioClienteFinal,
  };
}
