import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { SelectorSegmentadoProps } from '../types/props.types';

/**
 * Botones lado a lado para elegir una opción (mockup de Solicitar cotización).
 * Es genérico: el tipo T son los valores posibles, por ejemplo 'instalacion' | 'mantenimiento'.
 * Se usa en Solicitar cotización (tipo de servicio) y en el Formulario de cliente (tipo).
 */
export default function SelectorSegmentado<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambiar,
  error,
}: SelectorSegmentadoProps<T>) {
  return (
    <View className="mb-bloque">
      <Text className="mb-2 font-cuerpo-semi text-base text-texto">{etiqueta}</Text>

      <View className="flex-row gap-3" accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
        {opciones.map((opcion) => {
          const elegida = opcion.valor === valor;
          return (
            <Pressable
              key={opcion.valor}
              onPress={() => onCambiar(opcion.valor)}
              accessibilityRole="radio"
              accessibilityState={{ checked: elegida }}
              className={`h-14 flex-1 flex-row items-center justify-center rounded-campo border px-2 active:opacity-80 ${
                elegida ? 'border-primario bg-primario' : error ? 'border-error bg-fondo' : 'border-borde bg-fondo'
              }`}
            >
              {elegida ? (
                <Feather name="check-circle" size={20} color={COLORES.fondo} style={{ marginRight: 8 }} />
              ) : null}
              <Text
                className={`font-cuerpo-semi text-base ${elegida ? 'text-fondo' : 'text-texto'}`}
                numberOfLines={1}
              >
                {opcion.etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text className="mt-1 font-cuerpo text-sm text-error">{error}</Text> : null}
    </View>
  );
}
