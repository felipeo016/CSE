import { api } from './api';
import { mapearCita } from '../mappers/cita.mapper';
import type { CambioEstadoCita, Cita, DatosCita } from '../models/Cita';
import type { CitaApi, CitaCuerpoApi, ErrorApi } from '../types/api.types';
import { esUuid } from '../utils/consultas';

/**
 * Citas (RF-27, RF-28). Todas las peticiones usan la instancia de Axios de api.ts.
 * RLS: el cliente ve y agenda solo las suyas; el personal ve todas y es el único que cambia el
 * estado. Un trigger del servidor fuerza el estado Programada al crear, rechaza fechas pasadas y
 * ubicaciones o pedidos de otro cliente, y solo permite Programada → Realizada o Cancelada.
 */

const RUTA_CITAS = '/rest/v1/citas';

/** Columnas de la cita más el cliente, la ubicación y el número del pedido (relaciones). */
const COLUMNAS = [
  'id',
  'cliente_id',
  'tipo',
  'fecha',
  'franja',
  'ubicacion_id',
  'pedido_id',
  'estado',
  'creado_en',
  'cliente:clientes(nombre)',
  'ubicacion:ubicaciones(direccion,referencia)',
  'pedido:pedidos(numero)',
].join(',');

/** Pide al servidor que devuelva la fila guardada en POST y PATCH. */
const DEVOLVER_FILA = { Prefer: 'return=representation' };

const ERROR_SIN_CONFIRMAR: ErrorApi = {
  tipo: 'servidor',
  mensaje: 'No se pudo confirmar el registro. Intenta de nuevo.',
};

/** Citas de un cliente (Mis citas e Inicio). El orden de la lista lo pone la app (ordenarCitas). */
export async function listarCitasCliente(clienteId: string): Promise<Cita[]> {
  if (!esUuid(clienteId)) {
    return [];
  }
  const respuesta = await api.get<CitaApi[]>(RUTA_CITAS, {
    params: { select: COLUMNAS, cliente_id: `eq.${clienteId}`, order: 'fecha.asc,franja.asc' },
  });
  return respuesta.data.map(mapearCita);
}

/** Todas las citas, para el trabajador y el administrador (pestaña Citas). */
export async function listarTodasLasCitas(): Promise<Cita[]> {
  const respuesta = await api.get<CitaApi[]>(RUTA_CITAS, {
    params: { select: COLUMNAS, order: 'fecha.asc,franja.asc' },
  });
  return respuesta.data.map(mapearCita);
}

/**
 * Agenda una cita (RF-27). Devuelve la cita que guardó el servidor, ya Programada: la pantalla
 * solo confirma con esta respuesta.
 */
export async function crearCita(datos: DatosCita): Promise<Cita> {
  const cuerpo: CitaCuerpoApi = {
    cliente_id: datos.clienteId,
    tipo: datos.tipo,
    fecha: datos.fecha,
    franja: datos.franja,
    ubicacion_id: datos.ubicacionId,
    pedido_id: datos.pedidoId,
  };
  const respuesta = await api.post<CitaApi[]>(RUTA_CITAS, cuerpo, {
    params: { select: COLUMNAS },
    headers: DEVOLVER_FILA,
  });
  const fila = respuesta.data[0];
  if (!fila) {
    throw ERROR_SIN_CONFIRMAR;
  }
  return mapearCita(fila);
}

/**
 * El trabajador cambia el estado de una cita Programada a Realizada o Cancelada (RF-28).
 * Si el servidor no devuelve la fila (no existe o RLS no lo permite), se informa como error.
 */
export async function cambiarEstadoCita({ id, estado }: CambioEstadoCita): Promise<Cita> {
  if (!esUuid(id)) {
    throw { tipo: 'validacion', mensaje: 'Cita no encontrada' } satisfies ErrorApi;
  }
  const respuesta = await api.patch<CitaApi[]>(
    RUTA_CITAS,
    { estado },
    { params: { id: `eq.${id}`, select: COLUMNAS }, headers: DEVOLVER_FILA },
  );
  const fila = respuesta.data[0];
  if (!fila) {
    throw { tipo: 'no_autorizado', mensaje: 'Acceso no autorizado' } satisfies ErrorApi;
  }
  return mapearCita(fila);
}
