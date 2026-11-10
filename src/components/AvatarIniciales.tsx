import { Text, View } from 'react-native';

import type { AvatarInicialesProps } from '../types/props.types';

/** Círculo azul claro con las iniciales (mockup de Clientes: "LG" de Laura Gómez). */
export default function AvatarIniciales({ iniciales, tamano = 'normal' }: AvatarInicialesProps) {
  const grande = tamano === 'grande';
  return (
    <View
      className={`items-center justify-center rounded-full bg-primario/15 ${grande ? 'h-16 w-16' : 'h-12 w-12'}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text className={`font-titulo-semi text-primario ${grande ? 'text-2xl' : 'text-lg'}`}>
        {iniciales || '?'}
      </Text>
    </View>
  );
}
