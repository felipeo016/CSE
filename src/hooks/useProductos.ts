import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  crearProducto,
  desactivarProducto,
  editarProducto,
  listarProductos,
  obtenerProducto,
} from '../services/productos.service';
import { useSesionStore } from '../store/sesionStore';
import { useEnLinea } from './useEnLinea';
import type { DatosProducto, ProductoPersonal, ProductoSegunRol } from '../models/Producto';
import type { ErrorApi } from '../types/api.types';
import { conAvisoDeConexion, debeReintentar, type ConsultaConConexion } from '../utils/consultas';

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

/**
 * Resultado de las consultas de productos: el de TanStack Query más dos banderas para el aviso
 * de conexión (RF-05, RNF-08). Las ayudas comunes (reintentos y aviso) están en utils/consultas.ts.
 */
export type ConsultaProductos<T> = ConsultaConConexion<T>;

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

// ---------------------------------------------------------------------------------------------
// Mutaciones del personal (RF-29 a RF-31). networkMode 'always': sin conexión fallan enseguida
// con "sin_conexion" y no se confirma nada (RNF-08). Al responder el servidor se invalidan las
// listas de productos de todos los roles y el detalle, para que el catálogo se actualice.
// ---------------------------------------------------------------------------------------------

/** Crea un producto. El nuevo queda en caché y las listas se vuelven a pedir. */
export function useCrearProducto() {
  const clienteQuery = useQueryClient();
  return useMutation<ProductoPersonal, ErrorApi, DatosProducto>({
    mutationFn: crearProducto,
    networkMode: 'always',
    onSuccess: (producto) => {
      clienteQuery.setQueryData(claveProducto(producto.id), producto);
      // ['productos'] sin rol cubre el listado del personal y el del cliente.
      clienteQuery.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

/** Edita un producto. Recibe el id y los datos del formulario. */
export function useEditarProducto() {
  const clienteQuery = useQueryClient();
  return useMutation<ProductoPersonal, ErrorApi, { id: string; datos: DatosProducto }>({
    mutationFn: ({ id, datos }) => editarProducto(id, datos),
    networkMode: 'always',
    onSuccess: (producto) => {
      clienteQuery.setQueryData(claveProducto(producto.id), producto);
      clienteQuery.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

/** Elimina (desactiva) un producto. Recibe el id. */
export function useDesactivarProducto() {
  const clienteQuery = useQueryClient();
  return useMutation<void, ErrorApi, string>({
    mutationFn: desactivarProducto,
    networkMode: 'always',
    onSuccess: (_resultado, id) => {
      // El detalle ya no existe para nadie: "Producto no encontrado".
      clienteQuery.setQueryData(claveProducto(id), null);
      clienteQuery.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}
