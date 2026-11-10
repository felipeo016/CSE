import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import AvatarIniciales from './AvatarIniciales';
import { COLORES } from '../config/colores';
import type { TarjetaClienteProps } from '../types/props.types';
import { formatearTelefono } from '../utils/formato';

/** Tarjeta de un cliente en la lista (mockup de Clientes): iniciales, nombre, teléfono y flecha. */
export default function TarjetaCliente({ cliente, onPress }: TarjetaClienteProps) {
  // Si no tiene teléfono se muestra el correo; si tampoco, el tipo de cliente.
  const segundaLinea = cliente.telefono
    ? formatearTelefono(cliente.telefono)
    : (cliente.correo ?? cliente.tipoNombre);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${cliente.nombre}, ${segundaLinea}`}
      className="mb-bloque flex-row items-center rounded-tarjeta border border-borde bg-fondo p-4 active:opacity-80"
    >
      <AvatarIniciales iniciales={cliente.iniciales} />
      <View className="ml-4 flex-1">
        <Text className="font-cuerpo-semi text-lg text-texto" numberOfLines={1}>
          {cliente.nombre}
        </Text>
        <Text className="font-cuerpo text-base text-texto-suave" numberOfLines={1}>
          {segundaLinea}
        </Text>
      </View>
      <Feather name="chevron-right" size={22} color={COLORES.texto} />
    </Pressable>
  );
}
