import type { Rol } from '../models/Usuario';

/** Roles que pueden abrir cada grupo de pantallas (RF-03, RNF-05). */
export const ROLES_CLIENTE: readonly Rol[] = ['cliente'];
/** El administrador usa todas las pantallas del trabajador. */
export const ROLES_PERSONAL: readonly Rol[] = ['trabajador', 'administrador'];
export const ROLES_ADMINISTRADOR: readonly Rol[] = ['administrador'];
/** Pantallas de todos los roles con sesión: detalle de producto, detalle de cotización y mapa. */
export const ROLES_TODOS: readonly Rol[] = ['cliente', 'trabajador', 'administrador'];

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
