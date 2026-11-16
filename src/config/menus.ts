import type { OpcionMenu } from '../types/props.types';

/**
 * Opciones del menú lateral (Drawer) de cada rol, según las decisiones de navegación del equipo.
 * "pantalla" es el nombre del archivo dentro de app/(rol)/(drawer)/; "(tabs)" son las pestañas.
 * Cerrar sesión no está aquí: MenuLateral lo dibuja siempre al final.
 */
export const OPCIONES_MENU_CLIENTE: OpcionMenu[] = [
  { pantalla: '(tabs)', etiqueta: 'Inicio', icono: 'home' },
  { pantalla: 'mis-pedidos', etiqueta: 'Mis pedidos', icono: 'shopping-bag' },
  { pantalla: 'mis-citas', etiqueta: 'Mis citas', icono: 'calendar' },
  { pantalla: 'mis-ubicaciones', etiqueta: 'Mis ubicaciones', icono: 'map-pin' },
  { pantalla: 'ubicacion-negocio', etiqueta: 'Ubicación del negocio', icono: 'map' },
  { pantalla: 'perfil', etiqueta: 'Perfil', icono: 'user' },
];

/** Trabajador y administrador. */
export const OPCIONES_MENU_TRABAJADOR: OpcionMenu[] = [
  { pantalla: '(tabs)', etiqueta: 'Inicio', icono: 'home' },
  { pantalla: 'ubicaciones', etiqueta: 'Ubicaciones', icono: 'map-pin' },
  { pantalla: 'perfil', etiqueta: 'Perfil', icono: 'user' },
];

/** Administrador: lo mismo que el trabajador más Usuarios y roles (RF-34). */
export const OPCIONES_MENU_ADMINISTRADOR: OpcionMenu[] = [
  { pantalla: '(tabs)', etiqueta: 'Inicio', icono: 'home' },
  { pantalla: 'ubicaciones', etiqueta: 'Ubicaciones', icono: 'map-pin' },
  { pantalla: 'usuarios', etiqueta: 'Usuarios y roles', icono: 'users' },
  { pantalla: 'perfil', etiqueta: 'Perfil', icono: 'user' },
];
