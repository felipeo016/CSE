import { Text, View } from 'react-native';

import { NOMBRE_TIPO_SERVICIO, type TipoServicio } from '../models/Cotizacion';
import { NOMBRE_ESTADO_CITA, type EstadoCita } from '../models/Cita';
import type { EtiquetaEstadoCitaProps, EtiquetaTipoServicioProps } from '../types/props.types';

// Colores del mockup de Citas: Instalación azul y Mantenimiento naranja.
const COLOR_TIPO: Record<TipoServicio, string> = {
  instalacion: 'bg-primario',
  mantenimiento: 'bg-advertencia',
};

// Programada azul oscuro, Realizada verde y Cancelada gris (mismos colores de los estados finales).
const COLOR_ESTADO: Record<EstadoCita, { fondo: string; texto: string }> = {
  programada: { fondo: 'bg-secundario', texto: 'text-fondo' },
  realizada: { fondo: 'bg-exito', texto: 'text-fondo' },
  cancelada: { fondo: 'bg-borde', texto: 'text-texto-suave' },
};

/** Píldora con el tipo de servicio de la cita (mockup de Citas). */
export function EtiquetaTipoServicio({ tipo }: EtiquetaTipoServicioProps) {
  return (
    <View className={`self-start rounded-boton px-3 py-1 ${COLOR_TIPO[tipo]}`}>
      <Text className="font-cuerpo-semi text-sm text-fondo">{NOMBRE_TIPO_SERVICIO[tipo]}</Text>
    </View>
  );
}

/** Píldora con el estado de la cita: Programada, Realizada o Cancelada. */
export function EtiquetaEstadoCita({ estado }: EtiquetaEstadoCitaProps) {
  const color = COLOR_ESTADO[estado];
  return (
    <View className={`rounded-boton px-3 py-1 ${color.fondo}`}>
      <Text className={`font-cuerpo-semi text-sm ${color.texto}`}>{NOMBRE_ESTADO_CITA[estado]}</Text>
    </View>
  );
}
