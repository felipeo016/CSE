import { Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { BarraBusquedaProps } from '../types/props.types';

/**
 * Barra de búsqueda gris redondeada con lupa (mockup de Clientes y Catálogo).
 * Cuando hay texto aparece una "x" para borrarlo.
 */
export default function BarraBusqueda({ valor, onChangeText, placeholder }: BarraBusquedaProps) {
  return (
    <View className="h-12 flex-row items-center rounded-boton bg-superficie px-4">
      <Feather name="search" size={20} color={COLORES.textoSuave} style={{ marginRight: 10 }} />
      <TextInput
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORES.textoSuave}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        className="flex-1 font-cuerpo text-base text-texto"
      />
      {valor.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Borrar búsqueda"
        >
          <Feather name="x" size={20} color={COLORES.textoSuave} />
        </Pressable>
      ) : null}
    </View>
  );
}
