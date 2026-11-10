import type { PerfilApi } from '../types/api.types';
import type { Usuario } from '../models/Usuario';

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
