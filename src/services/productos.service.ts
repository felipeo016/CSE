import { api } from './api';
import { useSesionStore } from '../store/sesionStore';
import { mapearProductoCatalogo, mapearProductoPersonal } from '../mappers/producto.mapper';
import type { ErrorApi, ProductoCatalogoApi, ProductoPersonalApi } from '../types/api.types';
import type { ProductoSegunRol } from '../models/Producto';
import type { Rol } from '../models/Usuario';

/**
 * Consultas de productos (RF-05, RF-08). Todas usan la instancia de Axios de api.ts.
 *
 * Qué tabla se consulta depende del rol de la sesión (RNF-06):
 * - Cliente: la vista productos_catalogo, que no tiene costo y trae el precio de su tipo.
 * - Personal (trabajador y administrador): la tabla productos completa, con costo y ambos precios.
 * Aunque la app se equivocara de ruta, la base no le entrega la tabla productos al cliente (RLS).
 */

const RUTA_CATALOGO = '/rest/v1/productos_catalogo';
const RUTA_PRODUCTOS = '/rest/v1/productos';

// Formato de un identificador uuid, como los que genera la base.
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Rol de la sesión actual. Sin sesión no se puede consultar nada. */
function rolActual(): Rol {
  const { usuario } = useSesionStore.getState();
  if (!usuario) {
    const error: ErrorApi = { tipo: 'sesion_expirada', mensaje: 'No hay una sesión abierta' };
    throw error;
  }
  return usuario.rol;
}

/** Lista los productos activos, ordenados por nombre, según el rol de la sesión. */
export async function listarProductos(): Promise<ProductoSegunRol[]> {
  if (rolActual() === 'cliente') {
    // La vista ya devuelve solo productos activos.
    const respuesta = await api.get<ProductoCatalogoApi[]>(RUTA_CATALOGO, {
      params: { select: '*', order: 'nombre' },
    });
    return respuesta.data.map(mapearProductoCatalogo);
  }

  const respuesta = await api.get<ProductoPersonalApi[]>(RUTA_PRODUCTOS, {
    params: { select: '*', activo: 'eq.true', order: 'nombre' },
  });
  return respuesta.data.map(mapearProductoPersonal);
}

/**
 * Busca un producto activo por id. Devuelve null si no existe, si está desactivado o si el id
 * no tiene formato válido; la pantalla muestra entonces "Producto no encontrado" (RF-08).
 */
export async function obtenerProducto(id: string): Promise<ProductoSegunRol | null> {
  const rol = rolActual();

  // Un id mal escrito (por ejemplo "abc") haría fallar la consulta en el servidor con un error
  // de formato. Como tampoco puede existir, se responde directamente "no encontrado".
  if (!FORMATO_UUID.test(id)) {
    return null;
  }

  if (rol === 'cliente') {
    const respuesta = await api.get<ProductoCatalogoApi[]>(RUTA_CATALOGO, {
      params: { select: '*', id: `eq.${id}` },
    });
    // PostgREST responde una lista: vacía cuando no hay coincidencias.
    const fila = respuesta.data[0];
    return fila ? mapearProductoCatalogo(fila) : null;
  }

  const respuesta = await api.get<ProductoPersonalApi[]>(RUTA_PRODUCTOS, {
    params: { select: '*', id: `eq.${id}`, activo: 'eq.true' },
  });
  const fila = respuesta.data[0];
  return fila ? mapearProductoPersonal(fila) : null;
}
