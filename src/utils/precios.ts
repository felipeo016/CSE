import {
  esProductoPersonal,
  type ProductoSegunRol,
  type TipoCliente,
} from '../models/Producto';

/**
 * Precio que ve y paga un cliente según su tipo (decisión del equipo; RF-16):
 * - instalador → precio de instalador.
 * - final (por defecto) → precio de cliente final.
 * Devuelve null si el producto no tiene precio para ese tipo: en la cotización no se puede
 * agregar hasta que se registre el precio.
 *
 * Con un producto del personal (trabajador o administrador) elige entre los dos precios.
 * Con un producto del catálogo del cliente, el servidor ya eligió el precio del tipo de ese
 * cliente: solo se devuelve si coincide con el tipo pedido.
 */
export function precioParaCliente(
  producto: ProductoSegunRol,
  tipoCliente: TipoCliente,
): number | null {
  if (esProductoPersonal(producto)) {
    return tipoCliente === 'instalador' ? producto.precioInstalador : producto.precioClienteFinal;
  }
  return producto.tipoPrecio === tipoCliente ? producto.precio : null;
}
