import type { TipoCliente } from './Producto';

/** Nombre visible de cada tipo de cliente (decisión del equipo: por defecto final). */
export const NOMBRE_TIPO_CLIENTE: Record<TipoCliente, string> = {
  instalador: 'Instalador',
  final: 'Cliente final',
};

/** Cliente como lo usa la app (RF-33). Solo lo ven completo el trabajador y el administrador. */
export interface Cliente {
  id: string;
  nombre: string;
  /** Solo dígitos; null si no se registró. */
  telefono: string | null;
  /** null si no se registró. */
  correo: string | null;
  /** Define qué precio ve y paga: instalador o final. */
  tipo: TipoCliente;
  tipoNombre: string;
  /** true si el cliente se registró en la app (tiene cuenta); false si lo creó el trabajador. */
  tieneCuenta: boolean;
  /** Una o dos letras para el círculo de la lista, por ejemplo "LG" para Laura Gómez. */
  iniciales: string;
}

/** Datos mínimos del cliente que acompañan a una cotización del personal. */
export interface ClienteResumen {
  id: string;
  nombre: string;
  telefono: string | null;
  tipo: TipoCliente;
}

/**
 * Datos del formulario de cliente, tal como los escribe el trabajador.
 * El servicio quita los espacios del teléfono y convierte los campos vacíos en null.
 */
export interface DatosCliente {
  nombre: string;
  telefono: string;
  correo: string;
  tipo: TipoCliente;
}
