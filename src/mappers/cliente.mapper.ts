import type { ClienteApi, ClienteResumenApi } from '../types/api.types';
import { NOMBRE_TIPO_CLIENTE, type Cliente, type ClienteResumen } from '../models/Cliente';

/** Convierte las filas de clientes del servidor (snake_case) en los modelos de la app. */

/** Texto sin espacios sobrantes, o null si viene vacío. */
function textoONull(valor: string | null): string | null {
  const limpio = valor?.trim() ?? '';
  return limpio.length > 0 ? limpio : null;
}

/**
 * Iniciales para el círculo de la lista: primera letra de las dos primeras palabras.
 * "Laura Gómez" → "LG"; "Carlos" → "C".
 */
export function inicialesDe(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter((palabra) => palabra.length > 0);
  return palabras
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join('');
}

/** Fila de la tabla clientes → Cliente. */
export function mapearCliente(fila: ClienteApi): Cliente {
  const nombre = fila.nombre.trim();
  return {
    id: fila.id,
    nombre,
    telefono: textoONull(fila.telefono),
    correo: textoONull(fila.correo),
    tipo: fila.tipo,
    // Si llegara un tipo desconocido se muestra tal cual.
    tipoNombre: NOMBRE_TIPO_CLIENTE[fila.tipo] ?? fila.tipo,
    tieneCuenta: fila.usuario_id !== null,
    iniciales: inicialesDe(nombre),
  };
}

/** Cliente incluido dentro de una cotización → ClienteResumen. */
export function mapearClienteResumen(fila: ClienteResumenApi): ClienteResumen {
  return {
    id: fila.id,
    nombre: fila.nombre.trim(),
    telefono: textoONull(fila.telefono),
    tipo: fila.tipo,
  };
}
