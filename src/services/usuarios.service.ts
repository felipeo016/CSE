import { api } from './api';
import { mapearUsuarioAdmin } from '../mappers/usuario.mapper';
import type { DatosUsuarioAdmin, UsuarioAdmin } from '../models/Usuario';
import type { ErrorApi, PerfilApi, UsuarioAdminCuerpoApi } from '../types/api.types';
import { esUuid } from '../utils/consultas';

/**
 * Usuarios y roles (RF-34). Solo el administrador.
 * - La lista se lee de la tabla perfiles: la política RLS perfiles_leer deja al administrador
 *   ver todas las filas (a los demás, solo la suya).
 * - Crear, editar y activar o desactivar pasan por la Edge Function admin-usuarios: crear un
 *   usuario de Auth exige la llave secreta, que vive solo en los secretos de Supabase y nunca en
 *   la app. La función revisa con el token de la sesión que quien llama es administrador activo.
 * Todas las peticiones usan la instancia de Axios de api.ts (apikey y Authorization incluidos).
 */

const RUTA_PERFILES = '/rest/v1/perfiles';
const RUTA_FUNCION = '/functions/v1/admin-usuarios';

/** Columnas que se piden (nunca select=*). */
const COLUMNAS = 'id,nombre,correo,telefono,rol,activo,cliente_id,creado_en,actualizado_en';

const ERROR_NO_ENCONTRADO: ErrorApi = {
  tipo: 'validacion',
  mensaje: 'Usuario no encontrado',
  codigo: 'USUARIO_NO_ENCONTRADO',
};

/** Todos los usuarios por nombre. La búsqueda se hace en la app sobre la lista ya cargada. */
export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const respuesta = await api.get<PerfilApi[]>(RUTA_PERFILES, {
    params: { select: COLUMNAS, order: 'nombre' },
  });
  return respuesta.data.map(mapearUsuarioAdmin);
}

/** Un usuario por id. Devuelve null si no existe o si el id no tiene formato válido. */
export async function obtenerUsuario(id: string): Promise<UsuarioAdmin | null> {
  if (!esUuid(id)) {
    return null;
  }
  const respuesta = await api.get<PerfilApi[]>(RUTA_PERFILES, {
    params: { select: COLUMNAS, id: `eq.${id}` },
  });
  const fila = respuesta.data[0];
  return fila ? mapearUsuarioAdmin(fila) : null;
}

/** Llama a la Edge Function y convierte el perfil que devuelve. */
async function llamarFuncion(cuerpo: UsuarioAdminCuerpoApi): Promise<UsuarioAdmin> {
  const respuesta = await api.post<PerfilApi>(RUTA_FUNCION, cuerpo);
  return mapearUsuarioAdmin(respuesta.data);
}

/** Teléfono sin espacios: "300 123 4567" → "3001234567" (así lo exige la tabla perfiles). */
function telefonoSinEspacios(telefono: string): string {
  return telefono.replace(/\s/g, '');
}

/**
 * Crea un usuario con correo, contraseña temporal, nombre, teléfono y rol. Si el rol es
 * trabajador o administrador, la función le quita la ficha de cliente que crea el registro.
 */
export function crearUsuario(datos: DatosUsuarioAdmin): Promise<UsuarioAdmin> {
  return llamarFuncion({
    accion: 'crear',
    correo: datos.correo.trim().toLowerCase(),
    contrasena: datos.contrasena,
    nombre: datos.nombre.trim(),
    telefono: telefonoSinEspacios(datos.telefono),
    rol: datos.rol,
  });
}

/** Edita nombre, teléfono y rol. El correo no se cambia. */
export function editarUsuario(id: string, datos: DatosUsuarioAdmin): Promise<UsuarioAdmin> {
  if (!esUuid(id)) return Promise.reject(ERROR_NO_ENCONTRADO);
  return llamarFuncion({
    accion: 'editar',
    id,
    nombre: datos.nombre.trim(),
    telefono: telefonoSinEspacios(datos.telefono),
    rol: datos.rol,
  });
}

/** Activa o desactiva un usuario. Desactivado no puede iniciar sesión (RF-34). */
export function cambiarEstadoUsuario(id: string, activo: boolean): Promise<UsuarioAdmin> {
  if (!esUuid(id)) return Promise.reject(ERROR_NO_ENCONTRADO);
  return llamarFuncion({ accion: 'cambiar_estado', id, activo });
}
