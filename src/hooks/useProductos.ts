import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listarProductos, obtenerProducto } from '../services/productos.service';
import { useSesionStore } from '../store/sesionStore';
import { useEnLinea } from './useEnLinea';
import type { ProductoSegunRol } from '../models/Producto';
import type { ErrorApi } from '../types/api.types';

/**
 * Tiempos de caché de productos (RNF-03):
 * - staleTime 5 min: el inventario cambia poco durante una visita. Mientras los datos estén
 *   "frescos", volver al catálogo o a un detalle ya abierto los muestra al instante, sin petición.
 *   Pasado ese tiempo se muestran los de caché y se piden de nuevo por detrás.
 * - gcTime 30 min: si se sale de la pantalla, la respuesta se guarda media hora en memoria. Así,
 *   si se pierde la conexión, todavía hay un catálogo que mostrar con el aviso (RF-05).
 * El inventario real se vuelve a verificar en el servidor al comprar o aceptar una cotización.
 */
const STALE_TIME_PRODUCTOS_MS = 5 * 60 * 1000;
const GC_TIME_PRODUCTOS_MS = 30 * 60 * 1000;

/** Máximo de reintentos automáticos antes de mostrar el error con el botón Reintentar. */
const MAX_REINTENTOS = 2;

/**
 * Solo se reintenta lo que puede arreglarse solo (servidor ocupado o red inestable).
 * Un "Acceso no autorizado" o una sesión vencida no mejoran repitiendo la petición.
 */
function debeReintentar(fallos: number, error: ErrorApi): boolean {
  return fallos < MAX_REINTENTOS && (error.tipo === 'servidor' || error.tipo === 'sin_conexion');
}

/**
 * Resultado de las consultas de productos: el de TanStack Query más dos banderas para el aviso
 * de conexión (RF-05, RNF-08).
 */
export type ConsultaProductos<T> = UseQueryResult<T, ErrorApi> & {
  /** true si no hay conexión (el teléfono no tiene red o el servidor no respondió). */
  sinConexion: boolean;
  /** true si se están mostrando datos guardados porque no se pudieron actualizar. */
  mostrandoCache: boolean;
};

/** Agrega las banderas de conexión a una consulta. */
function conAvisoDeConexion<T>(
  consulta: UseQueryResult<T, ErrorApi>,
  enLinea: boolean,
): ConsultaProductos<T> {
  const sinConexion = !enLinea || consulta.error?.tipo === 'sin_conexion';
  return {
    ...consulta,
    sinConexion,
    mostrandoCache: sinConexion && consulta.data !== undefined,
  };
}

/** queryKey del listado: uno por rol, porque el cliente y el personal reciben datos distintos. */
export function claveProductos(rol: string | undefined) {
  return ['productos', rol] as const;
}

/** queryKey del detalle. Al cerrar sesión se borra toda la caché (sesionStore), así no se mezclan roles. */
export function claveProducto(id: string | undefined) {
  return ['producto', id] as const;
}

/**
 * Lista de productos del catálogo según el rol (RF-05).
 * networkMode 'always': sin conexión la petición falla enseguida con "sin_conexion" en lugar de
 * quedar en pausa, así la pantalla muestra los datos de caché con el aviso, o el error con
 * Reintentar si no hay nada guardado. Al volver la red, TanStack Query la repite sola.
 */
export function useProductos(): ConsultaProductos<ProductoSegunRol[]> {
  const rol = useSesionStore((estado) => estado.usuario?.rol);
  const enLinea = useEnLinea();
  const consulta = useQuery<ProductoSegunRol[], ErrorApi>({
    queryKey: claveProductos(rol),
    queryFn: listarProductos,
    enabled: rol !== undefined,
    staleTime: STALE_TIME_PRODUCTOS_MS,
    gcTime: GC_TIME_PRODUCTOS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}

/**
 * Detalle de un producto por id (RF-08). data es null si no existe: la pantalla muestra
 * "Producto no encontrado". Recibe el id de la ruta /producto/[id].
 */
export function useProducto(id: string | undefined): ConsultaProductos<ProductoSegunRol | null> {
  const hayUsuario = useSesionStore((estado) => estado.usuario !== null);
  const enLinea = useEnLinea();
  const consulta = useQuery<ProductoSegunRol | null, ErrorApi>({
    queryKey: claveProducto(id),
    // enabled garantiza que id existe cuando se ejecuta.
    queryFn: () => obtenerProducto(id ?? ''),
    enabled: hayUsuario && id !== undefined && id.length > 0,
    staleTime: STALE_TIME_PRODUCTOS_MS,
    gcTime: GC_TIME_PRODUCTOS_MS,
    retry: debeReintentar,
    networkMode: 'always',
  });
  return conAvisoDeConexion(consulta, enLinea);
}
