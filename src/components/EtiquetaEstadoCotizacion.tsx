import { Text, View } from 'react-native';

import {
  esPorCotizar,
  NOMBRE_ESTADO_COTIZACION,
  TEXTO_POR_COTIZAR,
  type EstadoCotizacion,
} from '../models/Cotizacion';
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
 * Píldora de color con el estado de una cotización.
 * - Personal: Nueva y Vista se muestran como "Enviada" (RF-19): el trabajador ya la mandó y el
 *   cliente todavía puede responder.
 * - Cliente: Solicitada y Borrador, o una cotización que llegó sin total, se muestran como
 *   "Por cotizar" (J5): aún no le llegan precios.
 */
export default function EtiquetaEstadoCotizacion({
  estado,
  paraPersonal = false,
  porCotizar: sinPrecios = false,
}: EtiquetaEstadoCotizacionProps) {
  const enviada = paraPersonal && (estado === 'nueva' || estado === 'vista');
  // Para el cliente: por el estado, o porque la cotización llegó sin total (sinPrecios).
  const porCotizar = !paraPersonal && (esPorCotizar(estado) || sinPrecios);

  let color = COLOR_ESTADO[estado];
  let texto = NOMBRE_ESTADO_COTIZACION[estado];
  if (enviada) {
    color = COLOR_ESTADO.nueva;
    texto = 'Enviada';
  } else if (porCotizar) {
    color = COLOR_ESTADO.solicitada;
    texto = TEXTO_POR_COTIZAR;
  }

  return (
    <View className={`rounded-boton px-3 py-1 ${color.fondo}`}>
      <Text className={`font-cuerpo-semi text-sm ${color.texto}`}>{texto}</Text>
    </View>
  );
}
