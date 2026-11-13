/** Rol de la cuenta: decide qué pestañas y opciones ve el usuario (RF-01, RF-03). */
export type Rol = 'cliente' | 'trabajador' | 'administrador';

/** Nombre visible de cada rol. */
export const NOMBRE_ROL: Record<Rol, string> = {
  cliente: 'Cliente',
  trabajador: 'Trabajador',
  administrador: 'Administrador',
};

/** Usuario con sesión, como lo usa la app (sin datos de Auth ni fechas internas). */
export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  /** Solo dígitos. Puede faltar en usuarios creados desde el panel de Supabase. */
  telefono: string | null;
  rol: Rol;
  /** Un perfil desactivado no puede usar la app (RF-34). */
  activo: boolean;
  /** Ficha de cliente asociada; null para trabajador y administrador. */
  clienteId: string | null;
}

/** Datos que el usuario puede cambiar en su Perfil. */
export interface DatosPerfilEditables {
  nombre: string;
  telefono: string;
}

/** Datos del formulario de registro de cliente (RF-02). */
export interface DatosRegistro {
  nombre: string;
  correo: string;
  telefono: string;
  contrasena: string;
}

/**
 * Usuario en la pantalla Usuarios y roles (RF-34): lo que ve el administrador de cada cuenta.
 * Agrega el nombre visible del rol y las iniciales para el círculo de la lista (mockup).
 */
export interface UsuarioAdmin extends Usuario {
  rolNombre: string;
  iniciales: string;
}

/**
 * Datos del formulario de usuario, tal como los escribe el administrador. Al editar no se usan
 * correo ni contraseña (el correo no se cambia y la contraseña la maneja el usuario).
 */
export interface DatosUsuarioAdmin {
  nombre: string;
  correo: string;
  telefono: string;
  contrasena: string;
  rol: Rol;
}
