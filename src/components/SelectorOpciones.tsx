import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { SelectorOpcionesProps } from '../types/props.types';

/**
 * Campo de lista desplegable (mockup del Formulario de producto: Categoría y Marca, con la flecha
 * hacia abajo). Al pulsarlo se abre una ventana con las opciones; la elegida lleva un check.
 * Es genérico: T son los valores posibles, por ejemplo las ocho categorías de RF-07.
 */
export default function SelectorOpciones<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambiar,
}: SelectorOpcionesProps<T>) {
  // Estado local: si la ventana de opciones está abierta.
  const [abierto, setAbierto] = useState(false);
  const elegida = opciones.find((opcion) => opcion.valor === valor);

  return (
    <View className="mb-bloque">
      <Pressable
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${etiqueta}: ${elegida?.etiqueta ?? 'sin elegir'}. Cambiar`}
        className="min-h-16 flex-row items-center rounded-campo border border-borde bg-fondo px-4 py-2 active:opacity-80"
      >
        {/* Etiqueta dentro del recuadro, como los demás campos del formulario. */}
        <View className="flex-1">
          <Text className="font-cuerpo-medio text-sm text-texto">{etiqueta}</Text>
          <Text className="font-cuerpo text-base text-texto" numberOfLines={1}>
            {elegida?.etiqueta ?? ''}
          </Text>
        </View>
        <Feather name="chevron-down" size={20} color={COLORES.texto} />
      </Pressable>

      <Modal visible={abierto} animationType="slide" onRequestClose={() => setAbierto(false)}>
        <SafeAreaView className="flex-1 bg-fondo">
          <View className="flex-row items-center px-pantalla py-4">
            <Pressable
              onPress={() => setAbierto(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={10}
              className="mr-3"
            >
              <Feather name="x" size={24} color={COLORES.texto} />
            </Pressable>
            <Text className="font-titulo text-2xl text-texto">{etiqueta}</Text>
          </View>

          <FlatList
            data={opciones}
            keyExtractor={(opcion) => opcion.valor}
            contentContainerClassName="px-pantalla pb-seccion"
            renderItem={({ item }) => {
              const activa = item.valor === valor;
              return (
                <Pressable
                  onPress={() => {
                    onCambiar(item.valor);
                    setAbierto(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: activa }}
                  className={`mb-2 h-14 flex-row items-center rounded-campo border px-4 active:opacity-80 ${
                    activa ? 'border-primario bg-primario' : 'border-borde bg-fondo'
                  }`}
                >
                  <Text
                    className={`flex-1 font-cuerpo-semi text-base ${activa ? 'text-fondo' : 'text-texto'}`}
                  >
                    {item.etiqueta}
                  </Text>
                  {activa ? <Feather name="check" size={20} color={COLORES.fondo} /> : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
