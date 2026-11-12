import { api } from './api';
import { useSesionStore } from '../store/sesionStore';
import {
  mapearCotizacionCliente,
  mapearCotizacionGuardada,
  mapearCotizacionPersonal,
  mapearPedidoCreado,
  mapearSolicitudCreada,
} from '../mappers/cotizacion.mapper';
import type {
  BorradorCotizacionCuerpoApi,
  CotizacionClienteApi,
  CotizacionFilaApi,
  CotizacionPersonalApi,
  ErrorApi,
  PedidoApi,
  SolicitudCotizacionCuerpoApi,
  SolicitudCreadaApi,
} from '../types/api.types';
import type {
  CotizacionGuardada,
  CotizacionSegunRol,
  DatosBorradorCotizacion,
  DatosSolicitudCotizacion,
  FiltrosCotizaciones,
  PedidoCreado,
  SolicitudCreada,
} from '../models/Cotizacion';
import type { Rol } from '../models/Usuario';
import { esUuid } from '../utils/consultas';

/**
 * Cotizaciones (RF-15 a RF-22). Todas las peticiones usan la instancia de Axios de api.ts.
 * La base decide qué filas ve cada rol (RLS): el cliente solo recibe las suyas y el personal
 * todas. Los errores con hint (COTIZACION_VENCIDA, INVENTARIO_INSUFICIENTE...) ya llegan
 * traducidos a ErrorApi por el interceptor de api.ts, con el mensaje en español.
 */

const RUTA_COTIZACIONES = '/rest/v1/cotizaciones';
/**
 * Bandeja y detalle del cliente (migración 007). La vista trae todas sus cotizaciones, pero las
 * que el trabajador aún prepara llegan como "solicitada", con el dinero en null y sin líneas.
 */
const RUTA_COTIZACIONES_CLIENTE = '/rest/v1/cotizaciones_cliente';
const RUTA_RPC = '/rest/v1/rpc';

/** Pide al servidor que devuelva la fila guardada en POST y PATCH. */
const DEVOLVER_FILA = { Prefer: 'return=representation' };

/**
 * Columnas que se piden (nunca select=*): así, si la tabla gana columnas, no llegan solas a la app.
 * Ninguna es costo ni ganancia de productos (RNF-06). estado_actual es la columna calculada que
 * devuelve "vencida" si ya pasó la vigencia.
 */
const COLUMNAS_CABECERA = [
  'id',
  'numero',
  'tipo_servicio',
  'descripcion_necesidad',
  'estado',
  'estado_actual',
  'descuento',
  'incluye_servicio',
  'costo_servicio',
  'subtotal',
  'impuesto',
  'total',
  'vence_en',
  'enviada_en',
  'vista_en',
  'respondida_en',
  'creado_en',
].join(',');

/**
 * Cliente (vista cotizaciones_cliente): las líneas y los productos de interés ya vienen como
 * listas dentro de cada fila, con los mismos campos, así que se piden como columnas normales.
 */
const COLUMNAS_CLIENTE = `${COLUMNAS_CABECERA},cotizacion_lineas,cotizacion_productos_interes`;

/**
 * Personal (tabla cotizaciones): líneas y productos de interés embebidos, y además el cliente.
 * Con búsqueda por cliente se usa !inner: así PostgREST solo devuelve las cotizaciones cuyo
 * cliente cumple el filtro (sin !inner devolvería todas).
 */
function columnasPersonal(conBusquedaCliente: boolean): string {
  const embebido = conBusquedaCliente ? 'clientes!inner' : 'clientes';
  return [
    COLUMNAS_CABECERA,
    'cotizacion_lineas(id,producto_id,codigo_producto,nombre_producto,precio_unitario,cantidad,subtotal)',
    'cotizacion_productos_interes(id,producto_id,nombre_producto,cantidad)',
    'cliente_id',
    `cliente:${embebido}(id,nombre,telefono,tipo)`,
  ].join(',');
}

/** Error para una cotización que no existe o que no es del cliente (RF-21). */
const ERROR_NO_ENCONTRADA: ErrorApi = {
  tipo: 'validacion',
  mensaje: 'Cotización no encontrada',
  codigo: 'COTIZACION_NO_ENCONTRADA',
};

/** Rol de la sesión actual. Sin sesión no se puede consultar nada. */
function rolActual(): Rol {
  const { usuario } = useSesionStore.getState();
  if (!usuario) {
    const error: ErrorApi = { tipo: 'sesion_expirada', mensaje: 'No hay una sesión abierta' };
    throw error;
  }
  return usuario.rol;
}

/**
 * Quita del texto de búsqueda los caracteres que tienen significado especial para PostgREST
 * (comodines, comas, paréntesis y comillas), para buscar solo el texto escrito.
 */
function limpiarBusqueda(texto: string): string {
  return texto.replace(/[*%,()"\\]/g, ' ').trim();
}

/** Parámetros de la URL según los filtros (RF-19). */
function parametrosDeFiltros(filtros: FiltrosCotizaciones, esPersonal: boolean) {
  const busqueda = esPersonal ? limpiarBusqueda(filtros.busquedaCliente ?? '') : '';
  const parametros: Record<string, string> = {
    select: esPersonal ? columnasPersonal(busqueda !== '') : COLUMNAS_CLIENTE,
    order: 'creado_en.desc',
  };
  // Orden de las líneas embebidas (personal). En la vista del cliente ya vienen ordenadas.
  if (esPersonal) {
    parametros['cotizacion_lineas.order'] = 'nombre_producto';
  }

  // El filtro usa estado_actual: así una cotización vencida no aparece como "Enviada".
  if (filtros.estado === 'enviada') {
    parametros.estado_actual = 'in.(nueva,vista)';
  } else if (filtros.estado) {
    parametros.estado_actual = `eq.${filtros.estado}`;
  }

  if (busqueda !== '') {
    // ilike: contiene el texto sin distinguir mayúsculas. * es el comodín de PostgREST.
    parametros['cliente.nombre'] = `ilike.*${busqueda}*`;
  }
  if (esPersonal && filtros.clienteId && esUuid(filtros.clienteId)) {
    parametros.cliente_id = `eq.${filtros.clienteId}`;
  }
  return parametros;
}

/** Lista las cotizaciones visibles para el rol, de la más reciente a la más antigua. */
export async function listarCotizaciones(
  filtros: FiltrosCotizaciones = {},
): Promise<CotizacionSegunRol[]> {
  if (rolActual() === 'cliente') {
    const respuesta = await api.get<CotizacionClienteApi[]>(RUTA_COTIZACIONES_CLIENTE, {
      params: parametrosDeFiltros(filtros, false),
    });
    return respuesta.data.map(mapearCotizacionCliente);
  }

  const respuesta = await api.get<CotizacionPersonalApi[]>(RUTA_COTIZACIONES, {
    params: parametrosDeFiltros(filtros, true),
  });
  return respuesta.data.map(mapearCotizacionPersonal);
}

/**
 * Busca una cotización por id (RF-21). Devuelve null si no existe, si el id no tiene formato
 * válido o si es de otro cliente (la base no se la entrega): la pantalla muestra
 * "Cotización no encontrada".
 */
export async function obtenerCotizacion(id: string): Promise<CotizacionSegunRol | null> {
  const rol = rolActual();
  if (!esUuid(id)) {
    return null;
  }

  if (rol === 'cliente') {
    const respuesta = await api.get<CotizacionClienteApi[]>(RUTA_COTIZACIONES_CLIENTE, {
      params: { ...parametrosDeFiltros({}, false), id: `eq.${id}` },
    });
    const fila = respuesta.data[0];
    return fila ? mapearCotizacionCliente(fila) : null;
  }

  const respuesta = await api.get<CotizacionPersonalApi[]>(RUTA_COTIZACIONES, {
    params: { ...parametrosDeFiltros({}, true), id: `eq.${id}` },
  });
  const fila = respuesta.data[0];
  return fila ? mapearCotizacionPersonal(fila) : null;
}

/**
 * Registra la solicitud del cliente con sus productos de interés (RF-15) en una sola petición.
 * La RPC lo hace en una transacción: si un producto falla, no queda la solicitud a medias.
 * El servidor la crea a nombre del cliente de la sesión; la app no envía cliente_id.
 */
export async function crearSolicitudCotizacion(
  datos: DatosSolicitudCotizacion,
): Promise<SolicitudCreada> {
  const cuerpo: SolicitudCotizacionCuerpoApi = {
    tipo_servicio: datos.tipoServicio,
    descripcion: datos.descripcion.trim(),
    productos_interes: datos.productosInteres.map((producto) =>
      producto.cantidad === undefined
        ? { producto_id: producto.productoId }
        : { producto_id: producto.productoId, cantidad: producto.cantidad },
    ),
  };
  const respuesta = await api.post<SolicitudCreadaApi>(
    `${RUTA_RPC}/crear_solicitud_cotizacion`,
    cuerpo,
  );
  return mapearSolicitudCreada(respuesta.data);
}

/**
 * Guarda una cotización en Borrador (RF-16, RF-17; solo personal) con UNA sola petición: la RPC
 * guardar_borrador_cotizacion (migración 006) guarda la cabecera y todas las líneas en una
 * transacción. Si algo falla (sin conexión, un producto sin precio o sin inventario...), el
 * borrador queda como estaba en el servidor.
 * - Sin datos.id crea un borrador nuevo; con id completa esa solicitud o ese borrador.
 * - Devuelve el id, el número y el total que calculó el servidor.
 */
export async function guardarBorradorCotizacion(
  datos: DatosBorradorCotizacion,
): Promise<CotizacionGuardada> {
  if (datos.id !== undefined && !esUuid(datos.id)) throw ERROR_NO_ENCONTRADA;

  const cuerpo: BorradorCotizacionCuerpoApi = {
    id: datos.id ?? null,
    cliente_id: datos.clienteId,
    tipo_servicio: datos.tipoServicio,
    descripcion: datos.descripcion.trim() || null,
    descuento: datos.descuento,
    incluye_servicio: datos.incluyeServicio,
    costo_servicio: datos.incluyeServicio ? datos.valorServicio : 0,
    lineas: datos.lineas.map((linea) => ({ producto_id: linea.productoId, cantidad: linea.cantidad })),
  };
  const respuesta = await api.post<CotizacionFilaApi>(
    `${RUTA_RPC}/guardar_borrador_cotizacion`,
    cuerpo,
  );
  return mapearCotizacionGuardada(respuesta.data);
}

/**
 * Envía al cliente un borrador ya guardado (RF-18): pasa a "nueva" y el servidor fija la vigencia
 * (vence_en) con los días de parametros_negocio. El servidor rechaza el envío sin productos o con
 * un descuento mayor al subtotal. Devuelve la cotización enviada con su total y su vencimiento.
 */
export async function enviarCotizacion(id: string): Promise<CotizacionGuardada> {
  if (!esUuid(id)) throw ERROR_NO_ENCONTRADA;
  const respuesta = await api.patch<CotizacionFilaApi[]>(
    RUTA_COTIZACIONES,
    { estado: 'nueva' },
    { params: { id: `eq.${id}` }, headers: DEVOLVER_FILA },
  );
  const fila = respuesta.data[0];
  if (!fila) throw ERROR_NO_ENCONTRADA;
  return mapearCotizacionGuardada(fila);
}

/** El cliente abre el detalle: Nueva pasa a Vista (RF-21). Solo el dueño (lo valida la RPC). */
export async function marcarCotizacionVista(id: string): Promise<void> {
  if (!esUuid(id)) throw ERROR_NO_ENCONTRADA;
  await api.post(`${RUTA_RPC}/marcar_cotizacion_vista`, { id });
}

/**
 * El cliente acepta (RF-22): el servidor verifica vigencia e inventario y crea el pedido con las
 * mismas líneas y el mismo total. Si falla, llega el ErrorApi con su código
 * (COTIZACION_VENCIDA, INVENTARIO_INSUFICIENTE...) y no se crea nada.
 */
export async function aceptarCotizacion(id: string): Promise<PedidoCreado> {
  if (!esUuid(id)) throw ERROR_NO_ENCONTRADA;
  const respuesta = await api.post<PedidoApi>(`${RUTA_RPC}/aceptar_cotizacion`, { id });
  return mapearPedidoCreado(respuesta.data);
}

/** El cliente rechaza la cotización (RF-22). */
export async function rechazarCotizacion(id: string): Promise<void> {
  if (!esUuid(id)) throw ERROR_NO_ENCONTRADA;
  await api.post(`${RUTA_RPC}/rechazar_cotizacion`, { id });
}
