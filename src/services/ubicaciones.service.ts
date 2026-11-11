import { api } from './api';
import { mapearUbicacion, mapearUbicaciones } from '../mappers/ubicacion.mapper';
import type { DatosUbicacion, Ubicacion } from '../models/Ubicacion';
import type { ErrorApi, UbicacionApi, UbicacionCuerpoApi } from '../types/api.types';
import { esUuid } from '../utils/consultas';

/**
 * Ubicaciones de servicio (RF-26). Todas las peticiones usan la instancia de api.ts.
 * La privacidad la garantiza la base con RLS (RNF-13): un cliente solo recibe y solo puede crear
 * las suyas; el trabajador y el administrador ven todas y registran a nombre de cualquier cliente.
 */

const RUTA_UBICACIONES = '/rest/v1/ubicaciones';

/** Columnas de la ubicación más el nombre del cliente (relación ubicaciones → clientes). */
const COLUMNAS = '*,cliente:clientes(nombre)';

const ERROR_CLIENTE_INVALIDO: ErrorApi = { tipo: 'validacion', mensaje: 'Cliente no encontrado' };

/**
 * Ubicaciones de un cliente, de la más reciente a la más antigua (Mis ubicaciones).
 * Además de RLS, se filtra por el cliente para pedir solo lo necesario.
 */
export async function listarUbicacionesCliente(clienteId: string): Promise<Ubicacion[]> {
  if (!esUuid(clienteId)) {
    return [];
  }
  const respuesta = await api.get<UbicacionApi[]>(RUTA_UBICACIONES, {
    params: { select: COLUMNAS, cliente_id: `eq.${clienteId}`, order: 'creado_en.desc' },
  });
  return mapearUbicaciones(respuesta.data);
}

/**
 * Todas las ubicaciones de servicio, para el trabajador y el administrador (Ubicaciones).
 * La búsqueda por cliente se hace en la app sobre la lista ya cargada (RNF-03).
 */
export async function listarTodasLasUbicaciones(): Promise<Ubicacion[]> {
  const respuesta = await api.get<UbicacionApi[]>(RUTA_UBICACIONES, {
    params: { select: COLUMNAS, order: 'creado_en.desc' },
  });
  return mapearUbicaciones(respuesta.data);
}

/**
 * Registra una ubicación de servicio (RF-26). Devuelve la ubicación que guardó el servidor:
 * la pantalla solo confirma con esta respuesta.
 */
export async function crearUbicacion(datos: DatosUbicacion): Promise<Ubicacion> {
  if (!esUuid(datos.clienteId)) {
    throw ERROR_CLIENTE_INVALIDO;
  }
  const referencia = datos.referencia.trim();
  const cuerpo: UbicacionCuerpoApi = {
    cliente_id: datos.clienteId,
    latitud: datos.coordenadas.latitud,
    longitud: datos.coordenadas.longitud,
    direccion: datos.direccion.trim(),
    referencia: referencia === '' ? null : referencia,
  };
  const respuesta = await api.post<UbicacionApi[]>(RUTA_UBICACIONES, cuerpo, {
    params: { select: COLUMNAS },
    // Pide al servidor que devuelva la fila guardada.
    headers: { Prefer: 'return=representation' },
  });
  const fila = respuesta.data[0];
  const ubicacion = fila ? mapearUbicacion(fila) : null;
  if (!ubicacion) {
    throw { tipo: 'servidor', mensaje: 'No se pudo confirmar el registro. Intenta de nuevo.' } satisfies ErrorApi;
  }
  return ubicacion;
}
