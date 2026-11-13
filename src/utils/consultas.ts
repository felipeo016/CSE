import type { UseQueryResult } from '@tanstack/react-query';

import type { ErrorApi } from '../types/api.types';

/**
 * Ayudas comunes de las consultas de TanStack Query (productos, cotizaciones, clientes...).
 * Estaban en useProductos (F4); se movieron aquí en F5 para no repetirlas en cada hook.
 */

/**
 * Error de una cuenta de cliente sin ficha en la tabla clientes (no debería pasar: la crea el
 * trigger al registrarse). Las consultas "del cliente de la sesión" lo lanzan en vez de quedar
 * deshabilitadas, que dejaría la pantalla cargando para siempre (RNF-02).
 */
export const ERROR_SIN_FICHA_CLIENTE: ErrorApi = {
  tipo: 'validacion',
  mensaje: 'Tu cuenta no tiene una ficha de cliente. Comunícate con el negocio.',
};

/** Máximo de reintentos automáticos antes de mostrar el error con el botón Reintentar. */
const MAX_REINTENTOS = 2;

/**
 * Solo se reintenta lo que puede arreglarse solo (servidor ocupado o red inestable).
 * Un "Acceso no autorizado" o una sesión vencida no mejoran repitiendo la petición.
 */
export function debeReintentar(fallos: number, error: ErrorApi): boolean {
  return fallos < MAX_REINTENTOS && (error.tipo === 'servidor' || error.tipo === 'sin_conexion');
}

/**
 * Resultado de una consulta con dos banderas para el aviso de conexión (RNF-08).
 */
export type ConsultaConConexion<T> = UseQueryResult<T, ErrorApi> & {
  /** true si no hay conexión (el teléfono no tiene red o el servidor no respondió). */
  sinConexion: boolean;
  /** true si se están mostrando datos guardados porque no se pudieron actualizar. */
  mostrandoCache: boolean;
};

/** Agrega las banderas de conexión a una consulta. */
export function conAvisoDeConexion<T>(
  consulta: UseQueryResult<T, ErrorApi>,
  enLinea: boolean,
): ConsultaConConexion<T> {
  const sinConexion = !enLinea || consulta.error?.tipo === 'sin_conexion';
  return {
    ...consulta,
    sinConexion,
    mostrandoCache: sinConexion && consulta.data !== undefined,
  };
}

// Formato de un identificador uuid, como los que genera la base.
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * true si el texto tiene formato de uuid. Un id mal escrito (por ejemplo "abc") haría fallar la
 * consulta en el servidor con un error de formato; como tampoco puede existir, los servicios
 * responden directamente "no encontrado".
 */
export function esUuid(id: string): boolean {
  return FORMATO_UUID.test(id);
}
