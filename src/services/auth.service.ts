import { api, CODIGOS_AUTH } from './api';
import { useSesionStore } from '../store/sesionStore';
import { mapearUsuario } from '../mappers/usuario.mapper';
import type {
  ErrorApi,
  PerfilActualizacionApi,
  PerfilApi,
  RegistroAuthApi,
  RegistroAuthCuerpoApi,
  SesionAuthApi,
} from '../types/api.types';
import type { DatosPerfilEditables, DatosRegistro, Usuario } from '../models/Usuario';

/**
 * Peticiones de autenticación y perfil (RF-01, RF-02, RF-04). Todas usan la instancia de api.ts.
 * Cuando el servidor responde bien, guardan el resultado en el sesionStore.
 */

const MENSAJE_CUENTA_DESACTIVADA = 'Tu cuenta está desactivada. Comunícate con el negocio.';

/** Quita los espacios del teléfono: el formulario acepta "300 123 4567" y el servidor exige dígitos. */
function soloDigitos(telefono: string): string {
  return telefono.replace(/\s/g, '');
}

/** Lee el perfil (rol, nombre, estado) de un usuario. Con token explícito sirve justo tras el login. */
async function pedirPerfil(usuarioId: string, token?: string): Promise<Usuario> {
  const respuesta = await api.get<PerfilApi[]>('/rest/v1/perfiles', {
    params: { id: `eq.${usuarioId}`, select: '*' },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const perfil = respuesta.data[0];
  if (!perfil) {
    const error: ErrorApi = { tipo: 'no_autorizado', mensaje: 'No se encontró el perfil de la cuenta' };
    throw error;
  }
  return mapearUsuario(perfil);
}

/** Avisa al servidor que el token ya no se usará. Si falla (sin conexión), no importa. */
async function revocarToken(token: string): Promise<void> {
  try {
    // sinToken + Authorization explícito: no se intenta renovar un token que se está cerrando.
    await api.post('/auth/v1/logout', null, {
      sinToken: true,
      timeout: 5000, // cerrar sesión no debe hacer esperar al usuario si no hay conexión
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // La sesión se borra del teléfono de todos modos.
  }
}

/**
 * Con la sesión que entregó Auth, lee el perfil y abre la sesión en el store.
 * Un perfil desactivado no entra: se revoca el token y se informa (RF-34).
 */
async function abrirSesionConPerfil(sesion: SesionAuthApi): Promise<Usuario> {
  const usuario = await pedirPerfil(sesion.user.id, sesion.access_token);
  if (!usuario.activo) {
    await revocarToken(sesion.access_token);
    const error: ErrorApi = { tipo: 'no_autorizado', mensaje: MENSAJE_CUENTA_DESACTIVADA };
    throw error;
  }
  useSesionStore.getState().abrirSesion({
    token: sesion.access_token,
    refreshToken: sesion.refresh_token,
    usuario,
  });
  return usuario;
}

/** Inicia sesión con correo y contraseña (RF-01). Devuelve el usuario con su rol. */
export async function iniciarSesion(correo: string, contrasena: string): Promise<Usuario> {
  const respuesta = await api.post<SesionAuthApi>(
    '/auth/v1/token?grant_type=password',
    { email: correo.trim(), password: contrasena },
    { sinToken: true },
  );
  return abrirSesionConPerfil(respuesta.data);
}

/** Resultado del registro: con sesión abierta, o pendiente de confirmar el correo. */
export type ResultadoRegistro =
  | { sesionIniciada: true; usuario: Usuario }
  | { sesionIniciada: false };

/**
 * Registra un cliente (RF-02). El trigger al_crear_usuario de Supabase crea su perfil con rol
 * cliente y su ficha de cliente con el nombre y el teléfono enviados en "data".
 */
export async function registrarCliente(datos: DatosRegistro): Promise<ResultadoRegistro> {
  const cuerpo: RegistroAuthCuerpoApi = {
    email: datos.correo.trim(),
    password: datos.contrasena,
    data: { nombre: datos.nombre.trim(), telefono: soloDigitos(datos.telefono) },
  };
  const respuesta = await api.post<RegistroAuthApi>('/auth/v1/signup', cuerpo, { sinToken: true });
  const resultado = respuesta.data;

  // "Confirm email" apagado: Supabase ya devuelve la sesión y se entra directo.
  if ('access_token' in resultado) {
    const usuario = await abrirSesionConPerfil(resultado);
    return { sesionIniciada: true, usuario };
  }

  // "Confirm email" encendido: un correo ya usado devuelve un usuario sin identidades.
  if (resultado.identities && resultado.identities.length === 0) {
    const error: ErrorApi = {
      tipo: 'conflicto',
      mensaje: 'Este correo ya está registrado',
      codigo: CODIGOS_AUTH.correoRegistrado,
    };
    throw error;
  }
  return { sesionIniciada: false };
}

/** Datos actuales del usuario con sesión (pantalla Perfil). */
export async function obtenerPerfilActual(): Promise<Usuario> {
  const { usuario } = useSesionStore.getState();
  if (!usuario) {
    const error: ErrorApi = { tipo: 'sesion_expirada', mensaje: 'No hay una sesión abierta' };
    throw error;
  }
  return pedirPerfil(usuario.id);
}

/** Cambia el nombre y el teléfono propios. Solo actualiza el store si el servidor responde bien. */
export async function actualizarPerfil(datos: DatosPerfilEditables): Promise<Usuario> {
  const { usuario, actualizarUsuario } = useSesionStore.getState();
  if (!usuario) {
    const error: ErrorApi = { tipo: 'sesion_expirada', mensaje: 'No hay una sesión abierta' };
    throw error;
  }
  const cuerpo: PerfilActualizacionApi = {
    nombre: datos.nombre.trim(),
    telefono: soloDigitos(datos.telefono),
  };
  const respuesta = await api.patch<PerfilApi[]>('/rest/v1/perfiles', cuerpo, {
    params: { id: `eq.${usuario.id}` },
    headers: { Prefer: 'return=representation' },
  });
  const perfil = respuesta.data[0];
  // Lista vacía: la política RLS no dejó cambiar la fila (por ejemplo, perfil desactivado).
  if (!perfil) {
    const error: ErrorApi = { tipo: 'no_autorizado', mensaje: 'Acceso no autorizado' };
    throw error;
  }
  const actualizado = mapearUsuario(perfil);
  actualizarUsuario(actualizado);
  return actualizado;
}

/** Cierra la sesión (RF-04): revoca el token en el servidor y borra todo lo local. */
export async function cerrarSesion(): Promise<void> {
  const { token, cerrarSesion: borrarSesionLocal } = useSesionStore.getState();
  if (token) {
    await revocarToken(token);
  }
  borrarSesionLocal();
}
