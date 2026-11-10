import { api } from './api';
import { useSesionStore } from '../store/sesionStore';
import {
  mapearCotizacionCliente,
  mapearCotizacionPersonal,
  mapearPedidoCreado,
  mapearSolicitudCreada,
} from '../mappers/cotizacion.mapper';
import type {
  CotizacionBorradorCuerpoApi,
  CotizacionClienteApi,
  CotizacionFilaApi,
  CotizacionLineaCuerpoApi,
  CotizacionPersonalApi,
  ErrorApi,
  PedidoApi,
  SolicitudCotizacionCuerpoApi,
} from '../types/api.types';
import type {
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
const RUTA_LINEAS = '/rest/v1/cotizacion_lineas';
const RUTA_RPC = '/rest/v1/rpc';

/** Pide al servidor que devuelva la fila guardada en POST y PATCH. */
const DEVOLVER_FILA = { Prefer: 'return=representation' };

/**
 * Columnas que se piden (nunca select=*): así, si la tabla gana columnas, no llegan solas a la app.
 * Ninguna es costo ni ganancia de productos (RNF-06). estado_actual es la columna calculada que
 * devuelve "vencida" si ya pasó la vigencia.
 */
const COLUMNAS_CLIENTE = [
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
  'cotizacion_lineas(id,producto_id,codigo_producto,nombre_producto,precio_unitario,cantidad,subtotal)',
  'cotizacion_productos_interes(id,producto_id,nombre_producto,cantidad)',
].join(',');

/**
 * El personal recibe además el cliente. Con búsqueda por cliente se usa !inner: así PostgREST
 * solo devuelve las cotizaciones cuyo cliente cumple el filtro (sin !inner devolvería todas).
 */
function columnasPersonal(conBusquedaCliente: boolean): string {
  const embebido = conBusquedaCliente ? 'clientes!inner' : 'clientes';
  return `${COLUMNAS_CLIENTE},cliente_id,cliente:${embebido}(id,nombre,telefono,tipo)`;
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
    'cotizacion_lineas.order': 'nombre_producto',
  };

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
    const respuesta = await api.get<CotizacionClienteApi[]>(RUTA_COTIZACIONES, {
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
    const respuesta = await api.get<CotizacionClienteApi[]>(RUTA_COTIZACIONES, {
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
  const respuesta = await api.post<CotizacionFilaApi>(
    `${RUTA_RPC}/crear_solicitud_cotizacion`,
    cuerpo,
  );
  return mapearSolicitudCreada(respuesta.data);
}

/**
 * Guarda una cotización en Borrador (RF-16, RF-17; solo personal). Devuelve su id.
 * 1. Crea la cotización, o actualiza la solicitud o el borrador indicado en datos.id.
 * 2. Agrega o actualiza las líneas (upsert por cotización y producto).
 * 3. Quita las líneas que ya no están.
 * Se hace en ese orden para que, si una petición falla, el borrador no pierda líneas: queda
 * como estaba o con las nuevas, y el trabajador puede volver a guardar. Los totales los
 * recalcula el servidor después de cada cambio.
 */
export async function guardarBorradorCotizacion(datos: DatosBorradorCotizacion): Promise<string> {
  const cuerpo: CotizacionBorradorCuerpoApi = {
    cliente_id: datos.clienteId,
    tipo_servicio: datos.tipoServicio,
    descripcion_necesidad: datos.descripcion.trim() || null,
    estado: 'borrador',
    descuento: datos.descuento,
    incluye_servicio: datos.incluyeServicio,
    costo_servicio: datos.incluyeServicio ? datos.valorServicio : 0,
  };

  let id = datos.id;
  if (id) {
    if (!esUuid(id)) throw ERROR_NO_ENCONTRADA;
    const respuesta = await api.patch<CotizacionFilaApi[]>(RUTA_COTIZACIONES, cuerpo, {
      params: { id: `eq.${id}` },
      headers: DEVOLVER_FILA,
    });
    if (respuesta.data.length === 0) throw ERROR_NO_ENCONTRADA;
  } else {
    const respuesta = await api.post<CotizacionFilaApi[]>(RUTA_COTIZACIONES, cuerpo, {
      headers: DEVOLVER_FILA,
    });
    id = respuesta.data[0].id;
  }

  if (datos.lineas.length > 0) {
    const lineas: CotizacionLineaCuerpoApi[] = datos.lineas.map((linea) => ({
      cotizacion_id: id,
      producto_id: linea.productoId,
      cantidad: linea.cantidad,
    }));
    await api.post(RUTA_LINEAS, lineas, {
      params: { on_conflict: 'cotizacion_id,producto_id' },
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    });
  }

  // Quitar las líneas de productos que el trabajador sacó de la cotización.
  const productosQueQuedan = datos.lineas.map((linea) => linea.productoId).filter(esUuid);
  await api.delete(RUTA_LINEAS, {
    params:
      productosQueQuedan.length > 0
        ? { cotizacion_id: `eq.${id}`, producto_id: `not.in.(${productosQueQuedan.join(',')})` }
        : { cotizacion_id: `eq.${id}` },
  });

  return id;
}

/**
 * Envía la cotización al cliente (RF-18): pasa a "nueva" y el servidor fija la vigencia.
 * El servidor rechaza el envío sin productos o con un descuento mayor al subtotal.
 */
export async function enviarCotizacion(id: string): Promise<void> {
  if (!esUuid(id)) throw ERROR_NO_ENCONTRADA;
  const respuesta = await api.patch<CotizacionFilaApi[]>(
    RUTA_COTIZACIONES,
    { estado: 'nueva' },
    { params: { id: `eq.${id}` }, headers: DEVOLVER_FILA },
  );
  if (respuesta.data.length === 0) throw ERROR_NO_ENCONTRADA;
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
