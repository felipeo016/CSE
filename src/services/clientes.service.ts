import { api } from './api';
import { mapearCliente } from '../mappers/cliente.mapper';
import type { ClienteApi, ClienteCuerpoApi, ErrorApi } from '../types/api.types';
import type { Cliente, DatosCliente } from '../models/Cliente';
import { esUuid } from '../utils/consultas';

/**
 * Clientes (RF-33). Solo el personal (trabajador y administrador) puede listarlos, crearlos y
 * editarlos: lo exige la base con RLS. Todas las peticiones usan la instancia de api.ts.
 */

const RUTA_CLIENTES = '/rest/v1/clientes';

/** Pide al servidor que devuelva la fila guardada en POST y PATCH. */
const DEVOLVER_FILA = { Prefer: 'return=representation' };

const ERROR_NO_ENCONTRADO: ErrorApi = { tipo: 'validacion', mensaje: 'Cliente no encontrado' };

/**
 * Quita del texto de búsqueda los caracteres que tienen significado especial para PostgREST
 * (comodines, comas, paréntesis y comillas), para buscar solo el texto escrito.
 */
function limpiarBusqueda(texto: string): string {
  return texto.replace(/[*%,()"\\]/g, ' ').trim();
}

/**
 * Lista los clientes por nombre. Con búsqueda, deja solo los que contienen el texto en el
 * nombre o en el teléfono, sin distinguir mayúsculas (RF-33). En el teléfono se buscan los
 * dígitos sin espacios, porque así se guardan ("300 123" encuentra 3001234567).
 */
export async function listarClientes(busqueda = ''): Promise<Cliente[]> {
  const texto = limpiarBusqueda(busqueda);
  const parametros: Record<string, string> = { select: '*', order: 'nombre' };

  if (texto !== '') {
    const digitos = texto.replace(/\s/g, '');
    const condiciones = [`nombre.ilike."*${texto}*"`];
    if (/^\d+$/.test(digitos)) {
      condiciones.push(`telefono.ilike.*${digitos}*`);
    }
    // or=(a,b): cumple una u otra condición.
    parametros.or = `(${condiciones.join(',')})`;
  }

  const respuesta = await api.get<ClienteApi[]>(RUTA_CLIENTES, { params: parametros });
  return respuesta.data.map(mapearCliente);
}

/** Busca un cliente por id. Devuelve null si no existe o si el id no tiene formato válido. */
export async function obtenerCliente(id: string): Promise<Cliente | null> {
  if (!esUuid(id)) {
    return null;
  }
  const respuesta = await api.get<ClienteApi[]>(RUTA_CLIENTES, {
    params: { select: '*', id: `eq.${id}` },
  });
  const fila = respuesta.data[0];
  return fila ? mapearCliente(fila) : null;
}

/**
 * Datos del formulario → cuerpo de la petición: quita espacios sobrantes, quita los espacios
 * del teléfono ("300 123 4567" → "3001234567") y convierte los campos vacíos en null.
 */
function cuerpoCliente(datos: DatosCliente): ClienteCuerpoApi {
  const telefono = datos.telefono.replace(/\s/g, '');
  const correo = datos.correo.trim();
  return {
    nombre: datos.nombre.trim(),
    telefono: telefono === '' ? null : telefono,
    correo: correo === '' ? null : correo,
    tipo: datos.tipo,
  };
}

/** Crea un cliente sin cuenta en la app (RF-33). Devuelve el cliente guardado por el servidor. */
export async function crearCliente(datos: DatosCliente): Promise<Cliente> {
  const respuesta = await api.post<ClienteApi[]>(RUTA_CLIENTES, cuerpoCliente(datos), {
    headers: DEVOLVER_FILA,
  });
  return mapearCliente(respuesta.data[0]);
}

/** Edita los datos de un cliente (RF-33). Devuelve el cliente como quedó en el servidor. */
export async function editarCliente(id: string, datos: DatosCliente): Promise<Cliente> {
  if (!esUuid(id)) throw ERROR_NO_ENCONTRADO;
  const respuesta = await api.patch<ClienteApi[]>(RUTA_CLIENTES, cuerpoCliente(datos), {
    params: { id: `eq.${id}` },
    headers: DEVOLVER_FILA,
  });
  const fila = respuesta.data[0];
  if (!fila) throw ERROR_NO_ENCONTRADO;
  return mapearCliente(fila);
}
