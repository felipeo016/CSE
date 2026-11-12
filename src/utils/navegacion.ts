import type { PedidoCreado } from '../models/Cotizacion';
import type { Rol } from '../models/Usuario';

/** Roles que pueden abrir cada grupo de pantallas (RF-03, RNF-05). */
export const ROLES_CLIENTE: readonly Rol[] = ['cliente'];
/** El administrador usa todas las pantallas del trabajador. */
export const ROLES_PERSONAL: readonly Rol[] = ['trabajador', 'administrador'];
export const ROLES_ADMINISTRADOR: readonly Rol[] = ['administrador'];
/** Pantallas de todos los roles con sesión: detalle de producto, detalle de cotización y mapa. */
export const ROLES_TODOS: readonly Rol[] = ['cliente', 'trabajador', 'administrador'];

/**
 * Ruta de Confirmación de pedido con los datos que muestra (RF-13, RF-22). La usan Aceptar
 * cotización (J5) y Confirmar pedido del carrito (J6). Los parámetros de una ruta viajan como
 * texto: la pantalla los vuelve a convertir y valida que el total sea un número.
 * @param pedido número y total que devolvió el servidor (nunca los calcula la app).
 * @param unidades suma de las cantidades de las líneas.
 * @param servicio nombre del servicio incluido ("Instalación"), o null si no incluye.
 */
export function rutaConfirmacionPedido(
  pedido: PedidoCreado,
  unidades: number,
  servicio: string | null,
) {
  return {
    pathname: '/(cliente)/flujos/confirmacion-pedido',
    params: {
      pedidoId: pedido.id,
      numero: pedido.numero,
      total: String(pedido.total),
      unidades: String(unidades),
      ...(servicio ? { servicio } : {}),
    },
  } as const;
}

/**
 * Pantalla de inicio de cada rol (RF-01). El administrador entra a las pestañas del trabajador,
 * donde además ve la pestaña Panel general y la opción Usuarios y roles del Drawer.
 * Las pestañas están dentro del grupo (drawer): ver docs/cambios-estructura.md.
 */
export function rutaInicioPorRol(rol: Rol) {
  return rol === 'cliente'
    ? '/(cliente)/(drawer)/(tabs)/inicio'
    : '/(trabajador)/(drawer)/(tabs)/productos';
}
