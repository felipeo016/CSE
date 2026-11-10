import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { AvisoConexionProps } from '../types/props.types';

/** Aviso amarillo de falta de conexión (RNF-08), por ejemplo sobre una lista guardada en caché. */
export default function AvisoConexion({ mensaje }: AvisoConexionProps) {
  return (
    <View
      className="mb-bloque flex-row items-center rounded-campo bg-advertencia/15 px-4 py-3"
      accessibilityLiveRegion="polite"
    >
      <Feather name="wifi-off" size={18} color={COLORES.advertencia} style={{ marginRight: 10 }} />
      <Text className="flex-1 font-cuerpo text-sm text-texto">{mensaje}</Text>
    </View>
  );
}
