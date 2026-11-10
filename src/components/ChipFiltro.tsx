import { Pressable, Text } from 'react-native';

import type { ChipFiltroProps } from '../types/props.types';

/** Chip de filtro con forma de píldora (mockup de Catálogo). El activo va relleno en azul. */
export default function ChipFiltro({ etiqueta, activo, onPress }: ChipFiltroProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      className={`mr-2 h-10 items-center justify-center rounded-boton border px-4 active:opacity-80 ${
        activo ? 'border-primario bg-primario' : 'border-borde bg-fondo'
      }`}
    >
      <Text className={`font-cuerpo-medio text-sm ${activo ? 'text-fondo' : 'text-texto'}`}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}
