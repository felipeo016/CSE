import { Text, View } from 'react-native';

import { NOMBRE_ESTADO_COTIZACION, type EstadoCotizacion } from '../models/Cotizacion';
import type { EtiquetaEstadoCotizacionProps } from '../types/props.types';

// Colores del mockup de Cotizaciones: Nueva azul, Vista amarilla, Aceptada verde, Rechazada roja.
const COLOR_ESTADO: Record<EstadoCotizacion, { fondo: string; texto: string }> = {
  solicitada: { fondo: 'bg-secundario', texto: 'text-fondo' },
  borrador: { fondo: 'bg-superficie', texto: 'text-texto' },
  nueva: { fondo: 'bg-primario', texto: 'text-fondo' },
  vista: { fondo: 'bg-advertencia', texto: 'text-texto' },
  aceptada: { fondo: 'bg-exito', texto: 'text-fondo' },
  rechazada: { fondo: 'bg-error', texto: 'text-fondo' },
  vencida: { fondo: 'bg-borde', texto: 'text-texto-suave' },
};

/**
 * Píldora de color con el estado de una cotización. Para el personal, Nueva y Vista se muestran
 * como "Enviada" (RF-19): el trabajador ya la mandó y el cliente todavía puede responder.
 */
export default function EtiquetaEstadoCotizacion({ estado, paraPersonal = false }: EtiquetaEstadoCotizacionProps) {
  const enviada = paraPersonal && (estado === 'nueva' || estado === 'vista');
  const color = enviada ? COLOR_ESTADO.nueva : COLOR_ESTADO[estado];
  const texto = enviada ? 'Enviada' : NOMBRE_ESTADO_COTIZACION[estado];

  return (
    <View className={`rounded-boton px-3 py-1 ${color.fondo}`}>
      <Text className={`font-cuerpo-semi text-sm ${color.texto}`}>{texto}</Text>
    </View>
  );
}
