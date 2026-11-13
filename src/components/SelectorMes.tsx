import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { SelectorMesProps } from '../types/props.types';
import { mesDe, nombreMes, sumarMeses } from '../utils/ventas';

/**
 * Periodo del Panel general (RF-35): flechas para ir al mes anterior o al siguiente. No deja pasar
 * del mes actual (no hay ventas futuras).
 */
export default function SelectorMes({ mes, onCambiar }: SelectorMesProps) {
  const esMesActual = mes >= mesDe(); // "AAAA-MM" se compara bien como texto
  const nombre = nombreMes(mes);

  return (
    <View className="flex-row items-center rounded-tarjeta border border-borde bg-fondo p-2">
      <Pressable
        onPress={() => onCambiar(sumarMeses(mes, -1))}
        accessibilityRole="button"
        accessibilityLabel="Mes anterior"
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-boton active:bg-superficie"
      >
        <Feather name="chevron-left" size={24} color={COLORES.primario} />
      </Pressable>

      <View className="flex-1 items-center">
        <Text className="font-cuerpo text-sm text-texto-suave">Periodo</Text>
        <Text className="font-titulo-semi text-lg capitalize text-texto" accessibilityLiveRegion="polite">
          {nombre}
        </Text>
      </View>

      <Pressable
        onPress={() => onCambiar(sumarMeses(mes, 1))}
        disabled={esMesActual}
        accessibilityRole="button"
        accessibilityLabel="Mes siguiente"
        accessibilityState={{ disabled: esMesActual }}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-boton active:bg-superficie"
      >
        <Feather name="chevron-right" size={24} color={esMesActual ? COLORES.borde : COLORES.primario} />
      </Pressable>
    </View>
  );
}
