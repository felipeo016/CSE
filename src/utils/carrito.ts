import type { LineaCarrito } from '../models/Carrito';
import type { ProductoSegunRol } from '../models/Producto';

/**
 * Arma la línea del carrito a partir de un producto del catálogo del cliente.
 * Devuelve null si el producto no tiene precio registrado para el cliente: no se puede comprar.
 * Solo copia los datos que el cliente ya ve; el costo nunca entra al carrito (RNF-06).
 */
export function lineaDesdeProducto(producto: ProductoSegunRol, cantidad: number): LineaCarrito | null {
  if (producto.precio === null) {
    return null;
  }
  return {
    productoId: producto.id,
    nombre: producto.nombre,
    codigo: producto.codigo,
    precio: producto.precio,
    cantidad,
    inventario: producto.inventario,
    imagenUrl: producto.imagenUrl,
  };
}
