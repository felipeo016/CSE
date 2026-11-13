import type { PerfilApi } from '../types/api.types';
import { NOMBRE_ROL, type Usuario, type UsuarioAdmin } from '../models/Usuario';
import { inicialesDe } from './cliente.mapper';

/** Convierte la fila de perfiles (snake_case del servidor) en el modelo Usuario de la app. */
export function mapearUsuario(perfil: PerfilApi): Usuario {
  return {
    id: perfil.id,
    nombre: perfil.nombre,
    correo: perfil.correo,
    telefono: perfil.telefono,
    rol: perfil.rol,
    activo: perfil.activo,
    clienteId: perfil.cliente_id,
  };
}

/** Fila de perfiles → usuario de la pantalla Usuarios y roles (RF-34). */
export function mapearUsuarioAdmin(perfil: PerfilApi): UsuarioAdmin {
  const usuario = mapearUsuario(perfil);
  return {
    ...usuario,
    nombre: usuario.nombre.trim(),
    // Si llegara un rol desconocido se muestra tal cual.
    rolNombre: NOMBRE_ROL[perfil.rol] ?? perfil.rol,
    iniciales: inicialesDe(usuario.nombre),
  };
}
