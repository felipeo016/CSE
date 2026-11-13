import { Alert } from 'react-native';

import { useDesactivarProducto } from './useProductos';
import type { ProductoPersonal } from '../models/Producto';

const MENSAJE_SIN_CONEXION =
  'Sin conexión. El producto no se eliminó. Revisa tu conexión y pulsa Reintentar.';

/**
 * Eliminar un producto (RF-31) con confirmación. Lo usan la lista de Productos y el formulario.
 * Eliminar = desactivar (activo = false): sale del catálogo, y los pedidos y cotizaciones
 * registrados conservan sus líneas porque la fila no se borra.
 *
 * Solo se informa "Producto eliminado" cuando el servidor respondió (RNF-08). Si falla, se ofrece
 * Reintentar; sin conexión la mutación falla sola y Reintentar la repite al volver la red.
 */
export function useEliminarProducto() {
  const desactivar = useDesactivarProducto();

  /**
   * @param producto el producto a eliminar.
   * @param alEliminar se llama cuando el servidor confirmó (por ejemplo, para salir del formulario).
   */
  function eliminar(producto: ProductoPersonal, alEliminar?: () => void) {
    desactivar.mutate(producto.id, {
      onSuccess: () => {
        Alert.alert('Producto eliminado', `"${producto.nombre}" ya no aparece en el catálogo.`);
        alEliminar?.();
      },
      onError: (error) => {
        Alert.alert(
          'No se pudo eliminar el producto',
          error.tipo === 'sin_conexion' ? MENSAJE_SIN_CONEXION : error.mensaje,
          [
            { text: 'Cerrar', style: 'cancel' },
            { text: 'Reintentar', onPress: () => eliminar(producto, alEliminar) },
          ],
        );
      },
    });
  }

  /** Pide confirmación antes de eliminar (RF-31). */
  function confirmarEliminar(producto: ProductoPersonal, alEliminar?: () => void) {
    // Mientras se elimina otro producto no se abre otra confirmación (sin doble envío).
    if (desactivar.isPending) {
      return;
    }
    Alert.alert(
      'Eliminar producto',
      `"${producto.nombre}" dejará de aparecer en el catálogo y no se podrá agregar a nuevas compras ni cotizaciones. Los pedidos y cotizaciones ya registrados conservan sus líneas. ¿Quieres eliminarlo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminar(producto, alEliminar) },
      ],
    );
  }

  return {
    confirmarEliminar,
    /** true mientras se espera la respuesta del servidor. */
    eliminando: desactivar.isPending,
    /** id del producto que se está eliminando, para mostrar su carga en la lista. */
    idEliminando: desactivar.isPending ? desactivar.variables : undefined,
  };
}
