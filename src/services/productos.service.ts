import { api, esErrorApi } from './api';
import { useSesionStore } from '../store/sesionStore';
import { mapearProductoCatalogo, mapearProductoPersonal } from '../mappers/producto.mapper';
import type {
  ErrorApi,
  ProductoCatalogoApi,
  ProductoCuerpoApi,
  ProductoDesactivarApi,
  ProductoPersonalApi,
} from '../types/api.types';
import type { DatosProducto, ProductoPersonal, ProductoSegunRol } from '../models/Producto';
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

// ---------------------------------------------------------------------------------------------
// Gestión de productos (RF-29 a RF-31). Solo el personal: la base lo exige con RLS y al cliente
// le respondería "Acceso no autorizado".
// ---------------------------------------------------------------------------------------------

/** Pide al servidor que devuelva la fila guardada en POST y PATCH. */
const DEVOLVER_FILA = { Prefer: 'return=representation' };

const ERROR_NO_ENCONTRADO: ErrorApi = { tipo: 'validacion', mensaje: 'Producto no encontrado' };

/** Mensaje cuando el código ya lo tiene otro producto (RNF-15). */
export const MENSAJE_CODIGO_REPETIDO = 'Ya existe un producto con ese código';

/** Texto sin espacios sobrantes, o null si queda vacío. */
function textoONull(texto: string): string | null {
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

/**
 * Datos del formulario → cuerpo de la petición (nombres del servidor).
 * El código se guarda sin espacios sobrantes y en mayúsculas, igual que el índice único
 * upper(trim(codigo)) y que los códigos del Excel ("ds-7204hghi-m1(c)" → "DS-7204HGHI-M1(C)").
 */
function cuerpoProducto(datos: DatosProducto): ProductoCuerpoApi {
  return {
    codigo: textoONull(datos.codigo)?.toUpperCase() ?? null,
    nombre: datos.nombre.trim(),
    descripcion: textoONull(datos.descripcion),
    marca: datos.marca,
    categoria: datos.categoria,
    costo: datos.costo,
    precio_instalador: datos.precioInstalador,
    precio_cliente_final: datos.precioClienteFinal,
    inventario: datos.inventario,
    imagen_url: textoONull(datos.imagenUrl),
  };
}

/**
 * Solo los campos que cambiaron → cuerpo del PATCH al editar (RNF-15). Un campo que no viene
 * no se envía, así el servidor conserva su valor: por ejemplo, el inventario que bajó por una
 * compra mientras el formulario estaba abierto no se sobrescribe con el valor viejo.
 */
function cuerpoCambios(cambios: Partial<DatosProducto>): Partial<ProductoCuerpoApi> {
  const cuerpo: Partial<ProductoCuerpoApi> = {};
  if (cambios.codigo !== undefined) cuerpo.codigo = textoONull(cambios.codigo)?.toUpperCase() ?? null;
  if (cambios.nombre !== undefined) cuerpo.nombre = cambios.nombre.trim();
  if (cambios.descripcion !== undefined) cuerpo.descripcion = textoONull(cambios.descripcion);
  if (cambios.marca !== undefined) cuerpo.marca = cambios.marca;
  if (cambios.categoria !== undefined) cuerpo.categoria = cambios.categoria;
  if (cambios.costo !== undefined) cuerpo.costo = cambios.costo;
  if (cambios.precioInstalador !== undefined) cuerpo.precio_instalador = cambios.precioInstalador;
  if (cambios.precioClienteFinal !== undefined) cuerpo.precio_cliente_final = cambios.precioClienteFinal;
  if (cambios.inventario !== undefined) cuerpo.inventario = cambios.inventario;
  if (cambios.imagenUrl !== undefined) cuerpo.imagen_url = textoONull(cambios.imagenUrl);
  return cuerpo;
}

/**
 * La tabla productos solo tiene una restricción única: el código (sin distinguir mayúsculas ni
 * espacios, 001_esquema.sql). Por eso el error 23505 se traduce al mensaje del código repetido.
 */
function traducirError(error: unknown): unknown {
  if (esErrorApi(error) && error.codigo === '23505') {
    const repetido: ErrorApi = { tipo: 'conflicto', mensaje: MENSAJE_CODIGO_REPETIDO, codigo: '23505' };
    return repetido;
  }
  return error;
}

/** Crea un producto (RF-29). Devuelve el producto guardado por el servidor. */
export async function crearProducto(datos: DatosProducto): Promise<ProductoPersonal> {
  try {
    const respuesta = await api.post<ProductoPersonalApi[]>(RUTA_PRODUCTOS, cuerpoProducto(datos), {
      headers: DEVOLVER_FILA,
    });
    return mapearProductoPersonal(respuesta.data[0]);
  } catch (error) {
    throw traducirError(error);
  }
}

/**
 * Edita un producto activo (RF-30). Recibe solo los campos que el trabajador cambió y devuelve
 * el producto como quedó en el servidor.
 */
export async function editarProducto(
  id: string,
  cambios: Partial<DatosProducto>,
): Promise<ProductoPersonal> {
  if (!FORMATO_UUID.test(id)) throw ERROR_NO_ENCONTRADO;
  const cuerpo = cuerpoCambios(cambios);
  try {
    // Sin cambios no hay nada que guardar: se pide el producto para confirmar que sigue activo.
    const respuesta =
      Object.keys(cuerpo).length === 0
        ? await api.get<ProductoPersonalApi[]>(RUTA_PRODUCTOS, {
            params: { select: '*', id: `eq.${id}`, activo: 'eq.true' },
          })
        : await api.patch<ProductoPersonalApi[]>(RUTA_PRODUCTOS, cuerpo, {
            params: { id: `eq.${id}`, activo: 'eq.true' },
            headers: DEVOLVER_FILA,
          });
    // Lista vacía: no existe o ya estaba desactivado.
    const fila = respuesta.data[0];
    if (!fila) throw ERROR_NO_ENCONTRADO;
    return mapearProductoPersonal(fila);
  } catch (error) {
    throw traducirError(error);
  }
}

/**
 * Elimina un producto (RF-31): lo desactiva (activo = false), no lo borra. Sale del catálogo y
 * de los selectores, y los pedidos y cotizaciones que ya lo tienen conservan sus líneas.
 */
export async function desactivarProducto(id: string): Promise<void> {
  if (!FORMATO_UUID.test(id)) throw ERROR_NO_ENCONTRADO;
  const cuerpo: ProductoDesactivarApi = { activo: false };
  const respuesta = await api.patch<ProductoPersonalApi[]>(RUTA_PRODUCTOS, cuerpo, {
    params: { id: `eq.${id}`, activo: 'eq.true' },
    headers: DEVOLVER_FILA,
  });
  if (respuesta.data.length === 0) throw ERROR_NO_ENCONTRADO;
}
