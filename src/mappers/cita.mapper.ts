import type { CitaApi } from '../types/api.types';
import { NOMBRE_TIPO_SERVICIO } from '../models/Cotizacion';
import { NOMBRE_ESTADO_CITA, type Cita } from '../models/Cita';
import { textoFranja } from '../utils/citas';

/** Fila de citas (snake_case, con cliente, ubicación y pedido embebidos) → Cita. */
export function mapearCita(fila: CitaApi): Cita {
  const referencia = fila.ubicacion?.referencia?.trim() ?? '';
  return {
    id: fila.id,
    clienteId: fila.cliente_id,
    clienteNombre: fila.cliente?.nombre.trim() ?? null,
    tipo: fila.tipo,
    tipoNombre: NOMBRE_TIPO_SERVICIO[fila.tipo] ?? fila.tipo,
    fecha: fila.fecha,
    franja: fila.franja,
    franjaTexto: textoFranja(fila.franja),
    ubicacionId: fila.ubicacion_id,
    direccion: fila.ubicacion?.direccion.trim() ?? null,
    referencia: referencia.length > 0 ? referencia : null,
    pedidoId: fila.pedido_id,
    pedidoNumero: fila.pedido?.numero ?? null,
    estado: fila.estado,
    estadoNombre: NOMBRE_ESTADO_CITA[fila.estado] ?? fila.estado,
    creadoEn: fila.creado_en,
  };
}
