import type { Rol } from '../models/Usuario';

/**
 * Pantalla de inicio de cada rol (RF-01). El administrador entra a las pestañas del trabajador;
 * J2 le agrega la pestaña Panel general y la opción Usuarios y roles.
 */
export function rutaInicioPorRol(rol: Rol) {
  return rol === 'cliente' ? '/(cliente)/(tabs)/inicio' : '/(trabajador)/(tabs)/productos';
}

/** Ruta del Perfil de cada rol (sección 7: (cliente)/perfil y (trabajador)/perfil). */
export function rutaPerfilPorRol(rol: Rol) {
  return rol === 'cliente' ? '/(cliente)/perfil' : '/(trabajador)/perfil';
}
