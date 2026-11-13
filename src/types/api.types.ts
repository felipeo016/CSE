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

/**
 * Cuerpo de POST y PATCH /rest/v1/productos (RF-29, RF-30). Solo lo envía el personal (RLS).
 * id, es_prueba y las fechas no se envían: los pone el servidor.
 */
export interface ProductoCuerpoApi {
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  marca: MarcaApi;
  categoria: CategoriaApi;
  costo: number;
  precio_instalador: number | null;
  precio_cliente_final: number;
  inventario: number;
  imagen_url: string | null;
}

/** Cuerpo de PATCH /rest/v1/productos para eliminar un producto: se desactiva (RF-31). */
export interface ProductoDesactivarApi {
  activo: false;
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

// ---------------------------------------------------------------------------------------------
// Clientes (RF-33)
// ---------------------------------------------------------------------------------------------

/** Fila de la tabla clientes (GET, POST y PATCH /rest/v1/clientes). */
export interface ClienteApi {
  id: string;
  nombre: string;
  /** Solo dígitos (7 a 15) o null. */
  telefono: string | null;
  correo: string | null;
  tipo: TipoClienteApi;
  /** Cuenta de la app asociada; null si el trabajador lo creó sin cuenta. */
  usuario_id: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Cuerpo de POST y PATCH /rest/v1/clientes. usuario_id no se envía: lo protege el servidor. */
export interface ClienteCuerpoApi {
  nombre: string;
  telefono: string | null;
  correo: string | null;
  tipo: TipoClienteApi;
}

/** Datos del cliente que vienen dentro de una cotización (select=...,cliente:clientes(...)). */
export interface ClienteResumenApi {
  id: string;
  nombre: string;
  telefono: string | null;
  tipo: TipoClienteApi;
}

// ---------------------------------------------------------------------------------------------
// Cotizaciones (RF-15 a RF-22)
// ---------------------------------------------------------------------------------------------

/** Estados guardados en la tabla cotizaciones (sección 5). */
export type EstadoCotizacionApi =
  | 'solicitada'
  | 'borrador'
  | 'nueva'
  | 'vista'
  | 'aceptada'
  | 'rechazada'
  | 'vencida';

/** Tipo de servicio de una cotización, un pedido o una cita. */
export type TipoServicioApi = 'instalacion' | 'mantenimiento';

/** Línea de cotización (tabla cotizacion_lineas). Copia nombre, código y precio; nunca el costo. */
export interface CotizacionLineaApi {
  id: string;
  producto_id: string;
  codigo_producto: string | null;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

/** Producto de interés de una solicitud (tabla cotizacion_productos_interes). */
export interface CotizacionProductoInteresApi {
  id: string;
  producto_id: string;
  nombre_producto: string;
  cantidad: number | null;
}

/**
 * Columnas de la tabla cotizaciones que la app pide (las mismas para cliente y personal).
 * costo_servicio es la tarifa de instalación o mantenimiento que paga el cliente, no el costo de
 * un producto: el cliente nunca recibe costo ni ganancia (RNF-06).
 */
export interface CotizacionFilaApi {
  id: string;
  numero: string;
  tipo_servicio: TipoServicioApi;
  descripcion_necesidad: string | null;
  estado: EstadoCotizacionApi;
  descuento: number;
  incluye_servicio: boolean;
  costo_servicio: number;
  subtotal: number;
  impuesto: number;
  total: number;
  /** Se fija al enviar: fecha de envío + vigencia. null mientras está en preparación. */
  vence_en: string | null;
  enviada_en: string | null;
  vista_en: string | null;
  respondida_en: string | null;
  creado_en: string;
}

/** Columnas de dinero que el servidor puede no enviar al cliente (ver CotizacionClienteApi). */
type DineroCotizacionApi = 'descuento' | 'costo_servicio' | 'subtotal' | 'impuesto' | 'total';

/**
 * Cotización con sus líneas y productos de interés, como la recibe el cliente.
 * estado_actual es la columna calculada del servidor (vencida si ya pasó vence_en).
 * Los valores de dinero y las líneas pueden faltar o llegar en null: el servidor puede no
 * entregarle al cliente los de una cotización que aún no le envían (Borrador). El mapper lo
 * traduce a "Por cotizar" (J5).
 * El cliente la recibe de la vista cotizaciones_cliente (migración 007): mientras se prepara
 * llega como "solicitada", con el dinero en null y cotizacion_lineas vacía.
 */
export interface CotizacionClienteApi
  extends Omit<CotizacionFilaApi, DineroCotizacionApi | 'incluye_servicio'> {
  /** null mientras se prepara (migración 007). */
  incluye_servicio?: boolean | null;
  descuento?: number | null;
  costo_servicio?: number | null;
  subtotal?: number | null;
  impuesto?: number | null;
  total?: number | null;
  estado_actual: EstadoCotizacionApi;
  cotizacion_lineas?: CotizacionLineaApi[] | null;
  cotizacion_productos_interes?: CotizacionProductoInteresApi[] | null;
}

/** Cotización como la recibe el personal: agrega el cliente al que pertenece. */
export interface CotizacionPersonalApi extends CotizacionClienteApi {
  cliente_id: string;
  cliente: ClienteResumenApi | null;
}

/**
 * Respuesta de crear_solicitud_cotizacion (migración 007): solo id, numero y estado. Las demás
 * columnas de la cotización llegan en null, así que la app no las lee.
 */
export type SolicitudCreadaApi = Pick<CotizacionFilaApi, 'id' | 'numero' | 'estado'>;

/** Cuerpo de POST /rest/v1/rpc/crear_solicitud_cotizacion (RF-15). */
export interface SolicitudCotizacionCuerpoApi {
  tipo_servicio: TipoServicioApi;
  descripcion: string;
  productos_interes: { producto_id: string; cantidad?: number }[];
}

/**
 * Cuerpo de POST /rest/v1/rpc/guardar_borrador_cotizacion (RF-16, RF-17; solo personal).
 * La RPC guarda la cabecera y todas las líneas en una sola transacción (migración 006).
 */
export interface BorradorCotizacionCuerpoApi {
  /** null: crea un borrador nuevo. Con id: completa esa solicitud o ese borrador. */
  id: string | null;
  cliente_id: string;
  tipo_servicio: TipoServicioApi;
  /** null: se conserva la descripción que ya tenía (la de la solicitud). */
  descripcion: string | null;
  descuento: number;
  incluye_servicio: boolean;
  /** null: el servidor pone la tarifa de parametros_negocio. */
  costo_servicio: number | null;
  /** Producto y cantidad; el servidor copia nombre, código y precio según el tipo del cliente. */
  lineas: { producto_id: string; cantidad: number }[];
}

// ---------------------------------------------------------------------------------------------
// Pedidos (RF-13, RF-14, RF-22)
// ---------------------------------------------------------------------------------------------

/** Fila de la tabla pedidos (la devuelven aceptar_cotizacion, registrar_pedido_carrito y el GET). */
export interface PedidoApi {
  id: string;
  numero: string;
  cliente_id: string;
  origen: 'carrito' | 'cotizacion';
  cotizacion_id: string | null;
  subtotal: number;
  descuento: number;
  impuesto: number;
  incluye_servicio: boolean;
  tipo_servicio: TipoServicioApi | null;
  costo_servicio: number;
  total: number;
  estado: 'pendiente';
  creado_en: string;
}

/** Línea de pedido: copia de código, nombre y precio de venta al comprar (nunca el costo). */
export interface PedidoLineaApi {
  id: string;
  producto_id: string;
  codigo_producto: string | null;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

/** Pedido con sus líneas (GET /rest/v1/pedidos?select=...,pedido_lineas(...)). */
export interface PedidoConLineasApi extends PedidoApi {
  pedido_lineas: PedidoLineaApi[] | null;
}

/**
 * Cuerpo de la RPC registrar_pedido_carrito (RF-13). Solo producto y cantidad: el servidor toma el
 * precio según el tipo del cliente y verifica el inventario.
 */
export interface PedidoCarritoCuerpoApi {
  lineas: { producto_id: string; cantidad: number }[];
  incluye_servicio: boolean;
  tipo_servicio: TipoServicioApi | null;
  /**
   * Identificador de la compra (migración 008). Con el mismo identificador y el mismo contenido,
   * el servidor devuelve el pedido que ya existe; con otro contenido responde COMPRA_YA_REGISTRADA.
   */
  compra_id: string;
}

// ---------------------------------------------------------------------------------------------
// Citas (RF-27, RF-28)
// ---------------------------------------------------------------------------------------------

export type EstadoCitaApi = 'programada' | 'realizada' | 'cancelada';

/**
 * Fila de la tabla citas con el cliente, la ubicación y el número del pedido embebidos
 * (GET /rest/v1/citas?select=...,cliente:clientes(nombre),...). RLS: el cliente recibe solo las
 * suyas; el personal, todas.
 */
export interface CitaApi {
  id: string;
  cliente_id: string;
  tipo: TipoServicioApi;
  /** Fecha sin hora, "AAAA-MM-DD". */
  fecha: string;
  /** "HH:mm-HH:mm", por ejemplo "08:00-10:00". */
  franja: string;
  ubicacion_id: string;
  pedido_id: string | null;
  estado: EstadoCitaApi;
  creado_en: string;
  cliente: { nombre: string } | null;
  ubicacion: { direccion: string; referencia: string | null } | null;
  pedido: { numero: string } | null;
}

/** Cuerpo de POST /rest/v1/citas. estado, creada_por y fechas los pone el servidor. */
export interface CitaCuerpoApi {
  cliente_id: string;
  tipo: TipoServicioApi;
  fecha: string;
  franja: string;
  ubicacion_id: string;
  pedido_id: string | null;
}

// ---------------------------------------------------------------------------------------------
// Ubicaciones de servicio (RF-26)
// ---------------------------------------------------------------------------------------------

/**
 * Fila de la tabla ubicaciones con el nombre del cliente
 * (GET /rest/v1/ubicaciones?select=*,cliente:clientes(nombre)). RLS: el cliente recibe solo
 * las suyas; el personal, todas (RNF-13).
 */
export interface UbicacionApi {
  id: string;
  cliente_id: string;
  latitud: number;
  longitud: number;
  direccion: string;
  referencia: string | null;
  /** Usuario que la registró (el cliente o un trabajador); la pone el servidor. */
  creada_por: string | null;
  creado_en: string;
  /** null si el cliente no se pudo leer. */
  cliente: { nombre: string } | null;
}

/** Cuerpo de POST /rest/v1/ubicaciones. creada_por y creado_en los pone el servidor. */
export interface UbicacionCuerpoApi {
  cliente_id: string;
  latitud: number;
  longitud: number;
  direccion: string;
  referencia: string | null;
}

// ---------------------------------------------------------------------------------------------
// Usuarios y roles (RF-34): Edge Function admin-usuarios (/functions/v1/admin-usuarios)
// La lista sale de GET /rest/v1/perfiles (RLS: el administrador ve todos) con PerfilApi.
// Crear, editar y activar o desactivar pasan por la función, que tiene la llave secreta.
// Responde la fila de perfiles (PerfilApi) y los errores con el formato de PostgREST.
// ---------------------------------------------------------------------------------------------

/** Crear un usuario de Auth con su perfil. La contraseña es temporal: el usuario puede cambiarla. */
export interface UsuarioCrearCuerpoApi {
  accion: 'crear';
  correo: string;
  contrasena: string;
  nombre: string;
  /** Solo dígitos (7 a 15). */
  telefono: string;
  rol: RolApi;
}

/** Editar nombre, teléfono y rol. El correo no se cambia. */
export interface UsuarioEditarCuerpoApi {
  accion: 'editar';
  id: string;
  nombre: string;
  telefono: string;
  rol: RolApi;
}

/** Activar o desactivar (también bloquea o desbloquea el inicio de sesión en Auth). */
export interface UsuarioEstadoCuerpoApi {
  accion: 'cambiar_estado';
  id: string;
  activo: boolean;
}

export type UsuarioAdminCuerpoApi =
  | UsuarioCrearCuerpoApi
  | UsuarioEditarCuerpoApi
  | UsuarioEstadoCuerpoApi;

// ---------------------------------------------------------------------------------------------
// Panel general (RF-35): RPC ventas_y_ganancias (solo administrador)
// ---------------------------------------------------------------------------------------------

/** Cuerpo de POST /rest/v1/rpc/ventas_y_ganancias. Fechas "AAAA-MM-DD", ambas incluidas. */
export interface VentasCuerpoApi {
  desde: string;
  hasta: string;
}

/**
 * Una fila por producto. Las ventas son precio de venta × unidades; la ganancia es
 * (precio de venta − costo guardado al vender) × unidades (migración 009). PostgREST entrega
 * bigint y numeric como números JSON.
 */
export interface VentaProductoApi {
  producto_id: string;
  codigo: string | null;
  nombre: string;
  unidades_instalador: number;
  ventas_instalador: number;
  unidades_final: number;
  ventas_final: number;
  unidades_total: number;
  ventas_total: number;
  ganancia: number;
}
