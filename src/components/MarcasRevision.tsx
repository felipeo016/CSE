import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { MarcasRevisionProps } from '../types/props.types';

/**
 * Píldoras naranjas con lo que el negocio debe revisar de un producto (Productos del trabajador):
 * "Código provisional", "Sin precio instalador"... Usa el color de advertencia del mockup
 * ("Stock bajo"). Si no hay motivos no muestra nada.
 */
export default function MarcasRevision({ motivos }: MarcasRevisionProps) {
  if (motivos.length === 0) {
    return null;
  }
  return (
    <View className="mt-2 flex-row flex-wrap gap-1" accessibilityLabel={`Por revisar: ${motivos.join(', ')}`}>
      {motivos.map((motivo) => (
        <View key={motivo} className="flex-row items-center rounded-boton bg-advertencia px-2 py-1">
          <Feather name="alert-triangle" size={12} color={COLORES.fondo} style={{ marginRight: 4 }} />
          <Text className="font-cuerpo-semi text-xs text-fondo">{motivo}</Text>
        </View>
      ))}
    </View>
  );
}
