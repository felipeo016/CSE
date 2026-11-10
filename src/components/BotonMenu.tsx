import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { BotonMenuProps } from '../types/props.types';

/** Botón de las tres rayas, a la izquierda del encabezado, que abre el menú lateral (Drawer). */
export default function BotonMenu({ onPress }: BotonMenuProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
      hitSlop={10}
      className="ml-4 h-11 w-11 items-center justify-center rounded-full active:bg-superficie"
    >
      <Feather name="menu" size={26} color={COLORES.texto} />
    </Pressable>
  );
}
