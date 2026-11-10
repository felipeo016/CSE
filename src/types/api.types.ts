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

// ---------------------------------------------------------------------------------------------
// Productos (RF-05, RF-08, RNF-06)
// ---------------------------------------------------------------------------------------------

/** Marcas permitidas por la tabla productos. */
export type MarcaApi = 'Hikvision' | 'EZVIZ' | 'HiLook';

/** Códigos de las ocho categorías de RF-07, como los guarda la base. */
export type CategoriaApi =
  | 'dvr'
  | 'camaras_turbo_hd'
  | 'camaras_wifi_ip'
  | 'kits'
  | 'alarmas_sensores'
  | 'discos_duros'
  | 'fuentes_ups'
  | 'accesorios_cableado';

/** Tipo de comprador: define qué precio ve y paga (tabla clientes, columna tipo). */
export type TipoClienteApi = 'instalador' | 'final';

/**
 * Fila de la vista productos_catalogo (lo que recibe el cliente).
 * No tiene costo (RNF-06) y trae un solo precio: el del tipo del cliente con sesión.
 * PostgREST entrega las columnas numeric como números JSON.
 */
export interface ProductoCatalogoApi {
  id: string;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  marca: MarcaApi;
  categoria: CategoriaApi;
  /** Puede ser null: un instalador ve null si el producto no tiene precio de instalador. */
  precio: number | null;
  tipo_precio: TipoClienteApi;
  inventario: number;
  imagen_url: string | null;
}

/** Fila completa de la tabla productos (solo la recibe el personal: trabajador y administrador). */
export interface ProductoPersonalApi {
  id: string;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  marca: MarcaApi;
  categoria: CategoriaApi;
  costo: number;
  /** Puede faltar en el Excel. */
  precio_instalador: number | null;
  precio_cliente_final: number;
  inventario: number;
  imagen_url: string | null;
  activo: boolean;
  es_prueba: boolean;
  creado_en: string;
  actualizado_en: string;
}

// ---------------------------------------------------------------------------------------------
// Parámetros del negocio (sección 5)
// ---------------------------------------------------------------------------------------------

/** Única fila de la tabla parametros_negocio (id = 1). */
export interface ParametrosNegocioApi {
  id: number;
  impuesto_porcentaje: number;
  tarifa_instalacion: number;
  tarifa_mantenimiento: number;
  vigencia_dias: number;
  actualizado_en: string;
}
