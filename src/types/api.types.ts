/**
 * Tipos de las respuestas del servicio remoto (Supabase), tal como llegan por HTTP.
 * Usan los nombres del servidor (snake_case). Los mappers los convierten a los modelos de src/models.
 */

// ---------------------------------------------------------------------------------------------
// Errores
// ---------------------------------------------------------------------------------------------

/** Clases de error que maneja la app; cada pantalla decide qué mostrar según el tipo. */
export type TipoErrorApi =
  | 'sin_conexion'
  | 'no_autorizado'
  | 'sesion_expirada'
  | 'conflicto'
  | 'validacion'
  | 'servidor';

/**
 * Error ya traducido que devuelven todos los servicios (el interceptor de api.ts lo arma).
 * - mensaje: texto en español listo para mostrar.
 * - codigo: el código fijo del servidor cuando existe (hint de las funciones, como
 *   INVENTARIO_INSUFICIENTE, o el error_code de Auth, como user_already_exists).
 */
export interface ErrorApi {
  tipo: TipoErrorApi;
  mensaje: string;
  codigo?: string;
}

/** Error de PostgREST (tablas, vistas y RPC): HTTP 4xx con este cuerpo. */
export interface ErrorPostgrestApi {
  message: string;
  code: string;
  hint: string | null;
  details: string | null;
}

/**
 * Error de Supabase Auth (/auth/v1). Según la versión del servidor llega con
 * error_code + msg, o con error + error_description; por eso todos son opcionales.
 */
export interface ErrorAuthApi {
  code?: number | string;
  error_code?: string;
  msg?: string;
  message?: string;
  error?: string;
  error_description?: string;
}

// ---------------------------------------------------------------------------------------------
// Auth (/auth/v1)
// ---------------------------------------------------------------------------------------------

/** Identidad de inicio de sesión de un usuario de Auth (correo, Google...). */
export interface IdentidadAuthApi {
  id: string;
  provider: string;
}

/** Usuario de Supabase Auth (no es el perfil: el rol está en la tabla perfiles). */
export interface UsuarioAuthApi {
  id: string;
  email: string;
  /**
   * Con "Confirm email" activo, registrarse con un correo ya usado devuelve un usuario
   * falso con identities vacío en lugar de un error.
   */
  identities?: IdentidadAuthApi[];
}

/** Respuesta de POST /auth/v1/token (password y refresh_token) y del registro con sesión. */
export interface SesionAuthApi {
  access_token: string;
  refresh_token: string;
  /** Segundos de vigencia del access_token (3600 por defecto). */
  expires_in: number;
  token_type: string;
  user: UsuarioAuthApi;
}

/**
 * Respuesta de POST /auth/v1/signup: con "Confirm email" apagado trae la sesión;
 * encendido, solo el usuario (debe confirmar el correo antes de iniciar sesión).
 */
export type RegistroAuthApi = SesionAuthApi | UsuarioAuthApi;

/** Cuerpo de POST /auth/v1/signup. "data" lo usa el trigger al_crear_usuario para el perfil. */
export interface RegistroAuthCuerpoApi {
  email: string;
  password: string;
  data: {
    nombre: string;
    /** Solo dígitos (7 a 15), como exige la tabla perfiles. */
    telefono: string;
  };
}

// ---------------------------------------------------------------------------------------------
// REST (/rest/v1)
// ---------------------------------------------------------------------------------------------

/** Rol guardado en la tabla perfiles. */
export type RolApi = 'cliente' | 'trabajador' | 'administrador';

/** Fila de la tabla perfiles (GET y PATCH /rest/v1/perfiles). */
export interface PerfilApi {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: RolApi;
  activo: boolean;
  cliente_id: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Cuerpo de PATCH /rest/v1/perfiles: el usuario solo cambia su nombre y su teléfono. */
export interface PerfilActualizacionApi {
  nombre: string;
  telefono: string;
}
