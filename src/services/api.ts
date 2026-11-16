import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

import type { ErrorApi, ErrorAuthApi, ErrorPostgrestApi, SesionAuthApi } from '../types/api.types';
import { useSesionStore } from '../store/sesionStore';

/**
 * Única instancia de Axios del proyecto (RNF-11). Todas las peticiones a Supabase salen de aquí.
 *
 * Encabezados (README, "Acceso al servicio HTTP"):
 * - apikey: la llave publishable (sb_publishable_...). Siempre. No es un JWT y nunca va en Authorization.
 * - Authorization: "Bearer <token>" solo con el access_token del usuario cuando hay sesión.
 */

// Opciones propias que aceptan las peticiones de esta app.
declare module 'axios' {
  interface AxiosRequestConfig {
    /** true: no enviar el token del usuario (login, registro y renovación del token). */
    sinToken?: boolean;
    /** Uso interno: la petición ya se repitió una vez tras renovar el token. */
    _reintentada?: boolean;
  }
}

const URL_SUPABASE = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const LLAVE_PUBLICA = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!URL_SUPABASE || !LLAVE_PUBLICA) {
  console.warn('Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en el archivo .env');
}

/** Tiempo máximo de espera de una petición. Pasado este tiempo se trata como falta de conexión. */
const TIEMPO_ESPERA_MS = 15000;

/** Mensaje de RF-04 cuando el token vence y no se pudo renovar. */
export const MENSAJE_SESION_EXPIRADA = 'Tu sesión expiró, inicia sesión de nuevo';

export const api = axios.create({
  baseURL: URL_SUPABASE,
  timeout: TIEMPO_ESPERA_MS,
  headers: {
    apikey: LLAVE_PUBLICA,
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------------------------
// Interceptor de petición: agrega el token del usuario si hay sesión.
// ---------------------------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const { token } = useSesionStore.getState();
  // Si la petición ya trae su propio Authorization (por ejemplo, justo después del login) se respeta.
  if (token && !config.sinToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------------------------
// Renovación del token (RF-04): se intenta una sola vez; si falla, se cierra la sesión.
// ---------------------------------------------------------------------------------------------

// Si varias peticiones reciben 401 a la vez, todas esperan la misma renovación.
let renovacionEnCurso: Promise<string> | null = null;

/** Pide un access_token nuevo con el refresh token guardado y lo guarda en el store. */
async function renovarToken(): Promise<string> {
  const { refreshToken, actualizarTokens } = useSesionStore.getState();
  if (!refreshToken) {
    throw crearError('sesion_expirada', MENSAJE_SESION_EXPIRADA);
  }
  const respuesta = await api.post<SesionAuthApi>(
    '/auth/v1/token?grant_type=refresh_token',
    { refresh_token: refreshToken },
    { sinToken: true },
  );
  actualizarTokens(respuesta.data.access_token, respuesta.data.refresh_token);
  return respuesta.data.access_token;
}

/** Cierra la sesión del dispositivo y lleva a Iniciar sesión con el aviso de sesión expirada. */
function terminarSesionExpirada() {
  useSesionStore.getState().cerrarSesion();
  router.replace({ pathname: '/(auth)/login', params: { aviso: 'sesion_expirada' } });
}

// ---------------------------------------------------------------------------------------------
// Interceptor de respuesta: todo error sale como ErrorApi (src/types/api.types.ts).
// ---------------------------------------------------------------------------------------------
api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: unknown) => {
    if (!(error instanceof AxiosError)) {
      return Promise.reject(crearError('servidor', MENSAJE_ERROR_GENERAL));
    }

    const config: InternalAxiosRequestConfig | undefined = error.config;
    const estado = error.response?.status;

    // 401 en una petición que llevaba el token de la sesión: el token venció.
    const tokenVencido =
      estado === 401 &&
      config !== undefined &&
      !config.sinToken &&
      !config._reintentada &&
      useSesionStore.getState().token !== null;

    if (tokenVencido && config) {
      try {
        renovacionEnCurso = renovacionEnCurso ?? renovarToken();
        const tokenNuevo = await renovacionEnCurso;
        // Se repite la petición original una sola vez, ahora con el token nuevo.
        config._reintentada = true;
        config.headers.Authorization = `Bearer ${tokenNuevo}`;
        return api.request(config);
      } catch (errorRenovacion) {
        // Sin conexión no se cierra la sesión: el token sigue guardado y Reintentar funcionará.
        if (esErrorApi(errorRenovacion) && errorRenovacion.tipo === 'sin_conexion') {
          return Promise.reject(errorRenovacion);
        }
        terminarSesionExpirada();
        return Promise.reject(crearError('sesion_expirada', MENSAJE_SESION_EXPIRADA));
      } finally {
        renovacionEnCurso = null;
      }
    }

    return Promise.reject(convertirError(error));
  },
);

// ---------------------------------------------------------------------------------------------
// Conversión de errores
// ---------------------------------------------------------------------------------------------

const MENSAJE_ERROR_GENERAL = 'No se pudo completar la operación. Intenta de nuevo.';
const MENSAJE_SIN_CONEXION =
  'No hay conexión con el servidor. Revisa tu conexión a internet e intenta de nuevo.';
const MENSAJE_NO_AUTORIZADO = 'Acceso no autorizado';

/** Códigos fijos de Supabase Auth que la app reconoce (error_code). */
export const CODIGOS_AUTH = {
  credencialesInvalidas: 'invalid_credentials',
  correoRegistrado: 'user_already_exists',
  correoSinConfirmar: 'email_not_confirmed',
  usuarioBloqueado: 'user_banned',
} as const;

// Mensaje en español para cada error_code de Auth.
const ERRORES_AUTH: Record<string, { tipo: ErrorApi['tipo']; mensaje: string }> = {
  invalid_credentials: { tipo: 'validacion', mensaje: 'Correo o contraseña incorrectos' },
  user_already_exists: { tipo: 'conflicto', mensaje: 'Este correo ya está registrado' },
  email_exists: { tipo: 'conflicto', mensaje: 'Este correo ya está registrado' },
  email_not_confirmed: {
    tipo: 'validacion',
    mensaje: 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
  },
  user_banned: {
    tipo: 'no_autorizado',
    mensaje: 'Tu cuenta está desactivada. Comunícate con el negocio.',
  },
  weak_password: {
    tipo: 'validacion',
    mensaje: 'La contraseña es muy débil. Usa una contraseña más larga o con más variedad.',
  },
  email_address_invalid: {
    tipo: 'validacion',
    mensaje: 'Ingresa un correo con el formato nombre@dominio.com',
  },
  over_request_rate_limit: {
    tipo: 'conflicto',
    mensaje: 'Demasiados intentos. Espera un momento e intenta de nuevo.',
  },
  over_email_send_rate_limit: {
    tipo: 'conflicto',
    mensaje: 'Demasiados intentos. Espera un momento e intenta de nuevo.',
  },
};

// Tipo de error para cada hint fijo de las funciones de Supabase (README, "Acceso al servicio HTTP").
// El "message" de esas funciones ya viene en español y se muestra tal cual (en tú: MENSAJES_EN_TU).
const TIPO_POR_HINT: Record<string, ErrorApi['tipo']> = {
  ACCESO_NO_AUTORIZADO: 'no_autorizado',
  COTIZACION_NO_ENCONTRADA: 'validacion',
  PRODUCTO_NO_ENCONTRADO: 'validacion',
  DATOS_INVALIDOS: 'validacion',
  SIN_PRECIO: 'validacion',
  FRANJA_PASADA: 'validacion',
  COTIZACION_VENCIDA: 'conflicto',
  COMPRA_YA_REGISTRADA: 'conflicto',
  CITA_REPETIDA: 'conflicto',
  ESTADO_NO_PERMITIDO: 'conflicto',
  PRODUCTO_NO_DISPONIBLE: 'conflicto',
  INVENTARIO_INSUFICIENTE: 'conflicto',
  ULTIMO_ADMINISTRADOR: 'conflicto',
  // Edge Function admin-usuarios (F8).
  CORREO_REGISTRADO: 'conflicto',
  USUARIO_NO_ENCONTRADO: 'validacion',
};

// Mensajes de las migraciones 002, 005 y 007 que siguen en "usted". La app trata al usuario de
// tú, así que se cambian aquí por su versión en tú (C1). Se busca el texto exacto: el hint
// (DATOS_INVALIDOS) lo comparten muchos mensajes y no basta para saber cuál es. Si el servidor
// cambia el texto, simplemente se muestra el original. Los demás mensajes ya están en tú o son
// citas literales de la documentación ("Acceso no autorizado", "Cotización no encontrada"...).
const MENSAJES_EN_TU: Record<string, string> = {
  'Elija el tipo de servicio': 'Elige el tipo de servicio', // 005 y 007 (solicitar cotización)
  'Describa su necesidad': 'Describe tu necesidad', // 005 y 007 (solicitar cotización)
  'Elija una ubicación registrada del cliente': 'Elige una ubicación registrada del cliente', // 002 (citas)
  'No puede cambiar su propio rol ni desactivar su propia cuenta':
    'No puedes cambiar tu propio rol ni desactivar tu propia cuenta', // 002 (perfiles)
};

/** Mensaje del servidor en tú (si estaba en usted) o tal cual llegó. */
function mensajeEnTu(mensaje: string): string {
  return MENSAJES_EN_TU[mensaje] ?? mensaje;
}

function crearError(tipo: ErrorApi['tipo'], mensaje: string, codigo?: string): ErrorApi {
  return codigo ? { tipo, mensaje, codigo } : { tipo, mensaje };
}

/** Indica si un valor es un ErrorApi (para usarlo en los catch de pantallas y servicios). */
export function esErrorApi(valor: unknown): valor is ErrorApi {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'tipo' in valor &&
    'mensaje' in valor &&
    typeof valor.mensaje === 'string'
  );
}

/** Mensaje para mostrar de cualquier error capturado. */
export function mensajeDeError(error: unknown): string {
  return esErrorApi(error) ? error.mensaje : MENSAJE_ERROR_GENERAL;
}

function esErrorPostgrest(cuerpo: unknown): cuerpo is ErrorPostgrestApi {
  return (
    typeof cuerpo === 'object' &&
    cuerpo !== null &&
    'message' in cuerpo &&
    'hint' in cuerpo &&
    'code' in cuerpo &&
    typeof cuerpo.code === 'string'
  );
}

function esErrorAuth(cuerpo: unknown): cuerpo is ErrorAuthApi {
  return (
    typeof cuerpo === 'object' &&
    cuerpo !== null &&
    ('error_code' in cuerpo || 'msg' in cuerpo || 'error_description' in cuerpo)
  );
}

/** Traduce un error de Axios al ErrorApi que usa la app. */
function convertirError(error: AxiosError): ErrorApi {
  // Sin respuesta: no hay internet, el servidor no contestó o se agotó el tiempo de espera (RNF-08).
  if (!error.response) {
    return crearError('sin_conexion', MENSAJE_SIN_CONEXION);
  }

  const estado = error.response.status;
  const cuerpo: unknown = error.response.data;

  // 1. Funciones y tablas (PostgREST): primero el hint fijo, luego el código de PostgreSQL.
  if (esErrorPostgrest(cuerpo)) {
    if (cuerpo.hint && TIPO_POR_HINT[cuerpo.hint]) {
      return crearError(TIPO_POR_HINT[cuerpo.hint], mensajeEnTu(cuerpo.message), cuerpo.hint);
    }
    if (cuerpo.code === '23505') {
      return crearError('conflicto', 'Ya existe un registro con esos datos', cuerpo.code);
    }
    if (cuerpo.code === '42501') {
      return crearError('no_autorizado', MENSAJE_NO_AUTORIZADO, cuerpo.code);
    }
    if (cuerpo.code === '23514' || cuerpo.code === '22P02') {
      return crearError('validacion', 'Revisa los datos ingresados', cuerpo.code);
    }
  }

  // 2. Supabase Auth: error_code (servidor nuevo) o error_description (servidor anterior).
  if (esErrorAuth(cuerpo)) {
    const codigo = cuerpo.error_code;
    if (codigo && ERRORES_AUTH[codigo]) {
      return crearError(ERRORES_AUTH[codigo].tipo, ERRORES_AUTH[codigo].mensaje, codigo);
    }
    // Formato anterior: {"error":"invalid_grant","error_description":"Invalid login credentials"}
    const descripcion = cuerpo.error_description ?? '';
    if (descripcion.includes('Invalid login credentials')) {
      const conocido = ERRORES_AUTH[CODIGOS_AUTH.credencialesInvalidas];
      return crearError(conocido.tipo, conocido.mensaje, CODIGOS_AUTH.credencialesInvalidas);
    }
    if (descripcion.includes('Email not confirmed')) {
      const conocido = ERRORES_AUTH[CODIGOS_AUTH.correoSinConfirmar];
      return crearError(conocido.tipo, conocido.mensaje, CODIGOS_AUTH.correoSinConfirmar);
    }
  }

  // 3. Por código HTTP.
  if (estado === 401) {
    return crearError('sesion_expirada', MENSAJE_SESION_EXPIRADA);
  }
  if (estado === 403) {
    return crearError('no_autorizado', MENSAJE_NO_AUTORIZADO);
  }
  if (estado === 409) {
    return crearError('conflicto', 'Ya existe un registro con esos datos');
  }
  if (estado >= 500) {
    return crearError('servidor', 'El servidor no pudo procesar la solicitud. Intenta más tarde.');
  }
  return crearError('validacion', MENSAJE_ERROR_GENERAL);
}
