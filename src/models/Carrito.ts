import type { TipoServicio } from './Cotizacion';

/**
 * Una línea del carrito (RF-10, RF-11). Se guarda en el teléfono (AsyncStorage), así que solo
 * tiene lo necesario para mostrarla y calcular: nunca el costo (RNF-06).
 */
export interface LineaCarrito {
  productoId: string;
  nombre: string;
  /** null si el producto no tiene código. */
  codigo: string | null;
  /** Precio unitario del tipo del cliente, en pesos, tal como lo entregó el catálogo. */
  precio: number;
  /** Entero entre 1 y inventario. */
  cantidad: number;
  /** Unidades disponibles cuando se agregó. El servidor lo vuelve a verificar al comprar (J6). */
  inventario: number;
  /** Para la miniatura del carrito; null usa la imagen alternativa. */
  imagenUrl: string | null;
}

/** Servicio que se puede pedir con la compra; null = sin servicio. */
export type ServicioCarrito = TipoServicio | null;

/** Resultado de agregar o cambiar una cantidad en el carrito. */
export type ResultadoCarrito = { ok: true } | { ok: false; mensaje: string };
