import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { OpcionTarjetaProps } from '../types/props.types';

/**
 * Opción elegible en forma de tarjeta, con ícono, título y detalle. La elegida va con borde azul
 * y el check. Se usa en Agendar cita para la ubicación y el pedido asociado.
 */
export default function OpcionTarjeta({ titulo, detalle, icono, elegida, onPress }: OpcionTarjetaProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: elegida }}
      className={`mb-2 flex-row items-center rounded-campo border px-4 py-3 active:opacity-80 ${
        elegida ? 'border-primario bg-primario/10' : 'border-borde bg-fondo'
      }`}
    >
      <Feather name={icono} size={20} color={elegida ? COLORES.primario : COLORES.texto} style={{ marginRight: 12 }} />
      <View className="flex-1">
        <Text className="font-cuerpo-semi text-base text-texto" numberOfLines={2}>
          {titulo}
        </Text>
        {detalle ? (
          <Text className="font-cuerpo text-sm text-texto-suave" numberOfLines={2}>
            {detalle}
          </Text>
        ) : null}
      </View>
      {elegida ? <Feather name="check-circle" size={20} color={COLORES.primario} /> : null}
    </Pressable>
  );
}
