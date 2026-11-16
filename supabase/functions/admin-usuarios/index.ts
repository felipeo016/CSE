// =====================================================================================
// admin-usuarios — Edge Function de Usuarios y roles (Prompt F8, Hito 4, responsable: Felipe)
//
// Por qué existe: crear un usuario de Supabase Auth exige la llave secreta (sb_secret_...), que
// nunca puede ir dentro de la app. Esta función corre en los servidores de Supabase, lee la llave
// de sus secretos (CSE_LLAVE_SECRETA) y hace el trabajo solo si quien llama es un administrador
// activo (RF-34, RNF-05).
//
// La app la llama con la misma instancia de Axios de siempre:
//   POST /functions/v1/admin-usuarios
//   apikey: <publishable>   Authorization: Bearer <access_token del administrador>
//
// Cuerpo según la acción:
//   { "accion": "crear",  "correo", "contrasena", "nombre", "telefono", "rol" }
//   { "accion": "editar", "id", "nombre", "telefono", "rol" }
//   { "accion": "cambiar_estado", "id", "activo": true | false }
// Responde la fila de perfiles como quedó (mismas columnas que GET /rest/v1/perfiles).
//
// Los errores salen con el mismo formato que PostgREST ({ message, hint, code, details }) para
// que el interceptor de src/services/api.ts los traduzca igual que los de las RPC:
//   ACCESO_NO_AUTORIZADO, DATOS_INVALIDOS, ULTIMO_ADMINISTRADOR (trigger de 002),
//   CORREO_REGISTRADO (nuevo) y USUARIO_NO_ENCONTRADO (nuevo).
//
// No usa librerías: solo fetch contra la API de Auth (/auth/v1/admin) y PostgREST (/rest/v1).
// Se publica desde el panel o con la Supabase CLI: ver el README, "Montaje de Supabase", paso 7.
// =====================================================================================

type Rol = 'cliente' | 'trabajador' | 'administrador';

/** Fila de public.perfiles. */
interface Perfil {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: Rol;
  activo: boolean;
  cliente_id: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Error que se responde a la app con el formato de PostgREST. */
class ErrorRespuesta extends Error {
  constructor(
    public estado: number,
    mensaje: string,
    public hint: string,
  ) {
    super(mensaje);
  }
}

const URL_SUPABASE = Deno.env.get('SUPABASE_URL') ?? '';
// La llave secreta (sb_secret_...). Se configura en Edge Functions > Secrets; nunca en la app.
const LLAVE_SECRETA = Deno.env.get('CSE_LLAVE_SECRETA') ?? '';

const ROLES: readonly Rol[] = ['cliente', 'trabajador', 'administrador'];
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMATO_TELEFONO = /^[0-9]{7,15}$/; // el mismo check de la tabla perfiles
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LONGITUD_MINIMA_CONTRASENA = 6; // mínimo de Supabase Auth por defecto
// "Desactivar" en Auth = bloquear el inicio de sesión por 100 años (no hay bloqueo indefinido).
const BLOQUEO_INDEFINIDO = '876000h';

const COLUMNAS_PERFIL = 'id,nombre,correo,telefono,rol,activo,cliente_id,creado_en,actualizado_en';

const ENCABEZADOS_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---------------------------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------------------------

function responder(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...ENCABEZADOS_CORS, 'Content-Type': 'application/json' },
  });
}

function responderError(error: ErrorRespuesta): Response {
  // code "P0001" es el que usa PostgreSQL para los raise exception de las funciones.
  return responder(error.estado, { message: error.message, hint: error.hint, code: 'P0001', details: null });
}

const noAutorizado = () => new ErrorRespuesta(403, 'Acceso no autorizado', 'ACCESO_NO_AUTORIZADO');
const datosInvalidos = (mensaje: string) => new ErrorRespuesta(400, mensaje, 'DATOS_INVALIDOS');
const noEncontrado = () => new ErrorRespuesta(404, 'Usuario no encontrado', 'USUARIO_NO_ENCONTRADO');

// ---------------------------------------------------------------------------------------------
// Llamadas a Supabase con la llave secreta. La llave nueva (sb_secret_) no es un JWT: va solo en
// el encabezado apikey, nunca en Authorization.
// ---------------------------------------------------------------------------------------------

interface RespuestaSupabase {
  ok: boolean;
  estado: number;
  datos: unknown;
}

async function llamar(
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown; encabezados?: Record<string, string> } = {},
): Promise<RespuestaSupabase> {
  const respuesta = await fetch(`${URL_SUPABASE}${ruta}`, {
    method: opciones.metodo ?? 'GET',
    headers: {
      apikey: LLAVE_SECRETA,
      'Content-Type': 'application/json',
      ...opciones.encabezados,
    },
    body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
  });
  const texto = await respuesta.text();
  let datos: unknown = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = texto;
  }
  return { ok: respuesta.ok, estado: respuesta.status, datos };
}

/** Lee un campo de texto de un objeto desconocido (respuesta de Supabase o cuerpo de la app). */
function textoDe(objeto: unknown, campo: string): string | null {
  if (typeof objeto === 'object' && objeto !== null && campo in objeto) {
    const valor = (objeto as Record<string, unknown>)[campo];
    return typeof valor === 'string' ? valor : null;
  }
  return null;
}

/**
 * Convierte un error de PostgREST en la respuesta para la app. Si trae un hint propio (por
 * ejemplo ULTIMO_ADMINISTRADOR del trigger de 002) se conserva con su mensaje.
 */
function errorDePostgrest(respuesta: RespuestaSupabase): ErrorRespuesta {
  const hint = textoDe(respuesta.datos, 'hint');
  const mensaje = textoDe(respuesta.datos, 'message');
  if (hint && mensaje) {
    return new ErrorRespuesta(400, mensaje, hint);
  }
  console.error('Error de PostgREST', respuesta.estado, JSON.stringify(respuesta.datos));
  return new ErrorRespuesta(500, 'No se pudo guardar el usuario. Intenta de nuevo.', 'ERROR_SERVIDOR');
}

async function leerPerfil(id: string): Promise<Perfil | null> {
  const respuesta = await llamar(`/rest/v1/perfiles?id=eq.${id}&select=${COLUMNAS_PERFIL}`);
  if (!respuesta.ok) throw errorDePostgrest(respuesta);
  const filas = respuesta.datos as Perfil[];
  return filas[0] ?? null;
}

/** PATCH a perfiles; devuelve la fila como quedó. */
async function actualizarPerfil(id: string, cambios: Record<string, unknown>): Promise<Perfil> {
  const respuesta = await llamar(`/rest/v1/perfiles?id=eq.${id}&select=${COLUMNAS_PERFIL}`, {
    metodo: 'PATCH',
    cuerpo: cambios,
    encabezados: { Prefer: 'return=representation' },
  });
  if (!respuesta.ok) throw errorDePostgrest(respuesta);
  const filas = respuesta.datos as Perfil[];
  if (!filas[0]) throw noEncontrado();
  return filas[0];
}

/** Bloquea o desbloquea el inicio de sesión en Auth. */
async function bloquearEnAuth(id: string, bloquear: boolean): Promise<boolean> {
  const respuesta = await llamar(`/auth/v1/admin/users/${id}`, {
    metodo: 'PUT',
    cuerpo: { ban_duration: bloquear ? BLOQUEO_INDEFINIDO : 'none' },
  });
  if (!respuesta.ok) {
    console.error('No se pudo cambiar el bloqueo en Auth', respuesta.estado, JSON.stringify(respuesta.datos));
  }
  return respuesta.ok;
}

// ---------------------------------------------------------------------------------------------
// Quién llama: debe ser un administrador activo.
// ---------------------------------------------------------------------------------------------

async function administradorQueLlama(peticion: Request): Promise<Perfil> {
  const autorizacion = peticion.headers.get('Authorization') ?? '';
  if (!autorizacion.startsWith('Bearer ')) {
    throw new ErrorRespuesta(401, 'Tu sesión expiró, inicia sesión de nuevo', 'SESION_EXPIRADA');
  }

  // Auth valida el token y dice de quién es. 401: vencido o falso (la app intentará renovarlo).
  const usuario = await llamar('/auth/v1/user', { encabezados: { Authorization: autorizacion } });
  const id = textoDe(usuario.datos, 'id');
  if (!usuario.ok || !id) {
    throw new ErrorRespuesta(401, 'Tu sesión expiró, inicia sesión de nuevo', 'SESION_EXPIRADA');
  }

  const perfil = await leerPerfil(id);
  if (!perfil || perfil.rol !== 'administrador' || !perfil.activo) {
    throw noAutorizado();
  }
  return perfil;
}

// ---------------------------------------------------------------------------------------------
// Validación de los datos que envía la app (la app ya valida; aquí se repite porque el servidor
// no confía en el cliente, RNF-05).
// ---------------------------------------------------------------------------------------------

interface DatosUsuario {
  nombre: string;
  telefono: string;
  rol: Rol;
}

function validarDatos(cuerpo: unknown): DatosUsuario {
  const nombre = (textoDe(cuerpo, 'nombre') ?? '').trim();
  // Teléfono sin espacios: "300 123 4567" → "3001234567".
  const telefono = (textoDe(cuerpo, 'telefono') ?? '').replace(/\s/g, '');
  const rol = textoDe(cuerpo, 'rol');

  if (nombre === '') throw datosInvalidos('Ingresa el nombre');
  if (!FORMATO_TELEFONO.test(telefono)) {
    throw datosInvalidos('El teléfono solo debe contener números, entre 7 y 15 dígitos');
  }
  if (!rol || !ROLES.includes(rol as Rol)) throw datosInvalidos('Elige el rol del usuario');
  return { nombre, telefono, rol: rol as Rol };
}

function validarId(cuerpo: unknown): string {
  const id = textoDe(cuerpo, 'id') ?? '';
  if (!FORMATO_UUID.test(id)) throw noEncontrado();
  return id;
}

// ---------------------------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------------------------

/**
 * Crear usuario (RF-34). Pasos:
 * 1. Revisa que el correo no exista (CORREO_REGISTRADO).
 * 2. Crea el usuario en Auth ya confirmado. El trigger al_crear_usuario (002) le crea un perfil
 *    con rol cliente y una ficha de cliente con el nombre y el teléfono de user_metadata.
 * 3. Si el rol es trabajador o administrador, pone el rol y quita la ficha de cliente, igual que
 *    la parte 2 del seed (el personal no compra a su nombre).
 * Si algo falla después del paso 2, se borra el usuario recién creado para no dejarlo a medias.
 */
async function crearUsuario(cuerpo: unknown): Promise<Perfil> {
  const datos = validarDatos(cuerpo);
  const correo = (textoDe(cuerpo, 'correo') ?? '').trim().toLowerCase();
  const contrasena = textoDe(cuerpo, 'contrasena') ?? '';

  if (!FORMATO_CORREO.test(correo)) throw datosInvalidos('Ingresa un correo con el formato nombre@dominio.com');
  if (contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    throw datosInvalidos(`La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres`);
  }

  // 1. Correo repetido (perfiles.correo es único). Auth guarda los correos en minúsculas y el
  //    trigger los copia igual, así que se compara con el correo en minúsculas.
  const existente = await llamar(`/rest/v1/perfiles?correo=eq.${encodeURIComponent(correo)}&select=id`);
  if (!existente.ok) throw errorDePostgrest(existente);
  if ((existente.datos as unknown[]).length > 0) {
    throw new ErrorRespuesta(409, 'Ya existe un usuario con ese correo', 'CORREO_REGISTRADO');
  }

  // 2. Usuario de Auth, confirmado (no necesita revisar el correo para entrar).
  const creado = await llamar('/auth/v1/admin/users', {
    metodo: 'POST',
    cuerpo: {
      email: correo,
      password: contrasena,
      email_confirm: true,
      user_metadata: { nombre: datos.nombre, telefono: datos.telefono },
    },
  });
  if (!creado.ok) {
    const codigo = textoDe(creado.datos, 'error_code');
    if (codigo === 'email_exists' || codigo === 'user_already_exists') {
      throw new ErrorRespuesta(409, 'Ya existe un usuario con ese correo', 'CORREO_REGISTRADO');
    }
    if (codigo === 'weak_password') {
      throw datosInvalidos('La contraseña es muy débil. Usa una más larga o con más variedad.');
    }
    if (codigo === 'email_address_invalid') {
      throw datosInvalidos('Ingresa un correo con el formato nombre@dominio.com');
    }
    console.error('Auth no creó el usuario', creado.estado, JSON.stringify(creado.datos));
    throw new ErrorRespuesta(500, 'No se pudo crear el usuario. Intenta de nuevo.', 'ERROR_SERVIDOR');
  }
  const idNuevo = textoDe(creado.datos, 'id');
  if (!idNuevo) {
    throw new ErrorRespuesta(500, 'No se pudo crear el usuario. Intenta de nuevo.', 'ERROR_SERVIDOR');
  }

  try {
    const perfil = await leerPerfil(idNuevo);
    if (!perfil) throw new ErrorRespuesta(500, 'No se pudo crear el perfil del usuario.', 'ERROR_SERVIDOR');
    if (datos.rol === 'cliente') {
      return perfil;
    }

    // 3. Personal: rol nuevo y sin ficha de cliente.
    const fichaCliente = perfil.cliente_id;
    const actualizado = await actualizarPerfil(idNuevo, { rol: datos.rol, cliente_id: null });
    if (fichaCliente) {
      const borrado = await llamar(`/rest/v1/clientes?id=eq.${fichaCliente}`, { metodo: 'DELETE' });
      if (!borrado.ok) throw errorDePostgrest(borrado);
    }
    return actualizado;
  } catch (error) {
    // Deshacer: borrar el usuario de Auth (su perfil se borra en cascada) y su ficha de cliente.
    await llamar(`/auth/v1/admin/users/${idNuevo}`, { metodo: 'DELETE' });
    await llamar(`/rest/v1/clientes?usuario_id=eq.${idNuevo}`, { metodo: 'DELETE' });
    throw error;
  }
}

/**
 * Editar nombre, teléfono y rol (RF-34). El correo no se cambia.
 * - Nadie cambia su propio rol (igual que el trigger perfiles_proteger de 002 para la app).
 * - Dejar cero administradores activos lo rechaza el trigger de 002 (ULTIMO_ADMINISTRADOR).
 * - Si pasa a cliente y no tiene ficha de cliente, se le crea una (sin ficha no podría comprar,
 *   solicitar cotizaciones ni agendar citas). Si ya tenía una, se reutiliza.
 * - El nombre y el teléfono se copian a su ficha de cliente (trigger perfiles_sincronizar_cliente).
 */
async function editarUsuario(cuerpo: unknown, administrador: Perfil): Promise<Perfil> {
  const id = validarId(cuerpo);
  const datos = validarDatos(cuerpo);
  const actual = await leerPerfil(id);
  if (!actual) throw noEncontrado();

  if (id === administrador.id && datos.rol !== actual.rol) {
    throw new ErrorRespuesta(403, 'No puedes cambiar tu propio rol', 'ACCESO_NO_AUTORIZADO');
  }

  const cambios: Record<string, unknown> = { nombre: datos.nombre, telefono: datos.telefono, rol: datos.rol };

  if (datos.rol === 'cliente' && !actual.cliente_id) {
    cambios.cliente_id = await fichaDeCliente(actual, datos);
  }
  return actualizarPerfil(id, cambios);
}

/** Ficha de cliente para un usuario que pasa a cliente: la suya si existe o una nueva. */
async function fichaDeCliente(perfil: Perfil, datos: DatosUsuario): Promise<string> {
  const buscada = await llamar(`/rest/v1/clientes?usuario_id=eq.${perfil.id}&select=id`);
  if (!buscada.ok) throw errorDePostgrest(buscada);
  const existente = (buscada.datos as { id: string }[])[0];
  if (existente) return existente.id;

  const creada = await llamar('/rest/v1/clientes?select=id', {
    metodo: 'POST',
    cuerpo: {
      nombre: datos.nombre,
      telefono: datos.telefono,
      correo: perfil.correo,
      tipo: 'final', // por defecto final (decisión del equipo)
      usuario_id: perfil.id,
    },
    encabezados: { Prefer: 'return=representation' },
  });
  if (!creada.ok) throw errorDePostgrest(creada);
  return (creada.datos as { id: string }[])[0].id;
}

/**
 * Activar o desactivar (RF-34). Se cambia el perfil (sin perfil activo el servidor le niega todo)
 * y además se bloquea el inicio de sesión en Auth, así un usuario desactivado no puede entrar.
 * Si el bloqueo de Auth falla, se devuelve el perfil a como estaba y se informa el error.
 */
async function cambiarEstado(cuerpo: unknown, administrador: Perfil): Promise<Perfil> {
  const id = validarId(cuerpo);
  const activo = typeof cuerpo === 'object' && cuerpo !== null && 'activo' in cuerpo
    ? (cuerpo as Record<string, unknown>).activo
    : undefined;
  if (typeof activo !== 'boolean') throw datosInvalidos('Indica si el usuario queda activo o inactivo');

  if (id === administrador.id) {
    throw new ErrorRespuesta(403, 'No puedes desactivar tu propia cuenta', 'ACCESO_NO_AUTORIZADO');
  }
  const actual = await leerPerfil(id);
  if (!actual) throw noEncontrado();
  if (actual.activo === activo) return actual;

  // El trigger de 002 rechaza dejar cero administradores activos (ULTIMO_ADMINISTRADOR).
  const actualizado = await actualizarPerfil(id, { activo });

  if (!(await bloquearEnAuth(id, !activo))) {
    await actualizarPerfil(id, { activo: actual.activo });
    throw new ErrorRespuesta(500, 'No se pudo cambiar el acceso del usuario. Intenta de nuevo.', 'ERROR_SERVIDOR');
  }
  return actualizado;
}

// ---------------------------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------------------------

Deno.serve(async (peticion: Request) => {
  if (peticion.method === 'OPTIONS') {
    return new Response('ok', { headers: ENCABEZADOS_CORS });
  }

  try {
    if (!URL_SUPABASE || !LLAVE_SECRETA) {
      console.error('Falta el secreto CSE_LLAVE_SECRETA o SUPABASE_URL');
      throw new ErrorRespuesta(500, 'El servidor no está configurado para administrar usuarios.', 'ERROR_SERVIDOR');
    }
    if (peticion.method !== 'POST') {
      throw datosInvalidos('Usa POST');
    }

    const administrador = await administradorQueLlama(peticion);

    let cuerpo: unknown;
    try {
      cuerpo = await peticion.json();
    } catch {
      throw datosInvalidos('El cuerpo de la petición no es JSON válido');
    }

    const accion = textoDe(cuerpo, 'accion');
    if (accion === 'crear') return responder(201, await crearUsuario(cuerpo));
    if (accion === 'editar') return responder(200, await editarUsuario(cuerpo, administrador));
    if (accion === 'cambiar_estado') return responder(200, await cambiarEstado(cuerpo, administrador));
    throw datosInvalidos('Acción no reconocida');
  } catch (error) {
    if (error instanceof ErrorRespuesta) {
      return responderError(error);
    }
    console.error('Error inesperado', error);
    return responderError(new ErrorRespuesta(500, 'No se pudo completar la operación. Intenta de nuevo.', 'ERROR_SERVIDOR'));
  }
});
