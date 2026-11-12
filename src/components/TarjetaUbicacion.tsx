import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { TarjetaUbicacionProps } from '../types/props.types';
import { formatearFecha } from '../utils/formato';

/**
 * Tarjeta de una ubicación de servicio: dirección, referencia, cliente (solo para el personal)
 * y fecha. Al tocarla se abre el mapa centrado en ella (RF-26).
 */
export default function TarjetaUbicacion({ ubicacion, mostrarCliente = false, onPress }: TarjetaUbicacionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${ubicacion.direccion}. Ver en el mapa`}
      className="mb-bloque flex-row items-center rounded-tarjeta border border-borde bg-fondo p-4 active:opacity-80"
    >
      <View className="h-12 w-12 items-center justify-center rounded-boton bg-exito/15">
        <Feather name="map-pin" size={22} color={COLORES.exito} />
      </View>

      <View className="ml-4 flex-1">
        {mostrarCliente ? (
          <Text className="font-cuerpo-semi text-base text-primario" numberOfLines={1}>
            {ubicacion.clienteNombre ?? 'Cliente sin nombre'}
          </Text>
        ) : null}
        <Text className="font-cuerpo-semi text-lg text-texto" numberOfLines={2}>
          {ubicacion.direccion}
        </Text>
        {ubicacion.referencia ? (
          <Text className="font-cuerpo text-base text-texto-suave" numberOfLines={2}>
            {ubicacion.referencia}
          </Text>
        ) : null}
        <Text className="mt-1 font-cuerpo text-sm text-texto-suave">
          Registrada el {formatearFecha(ubicacion.creadaEn)}
        </Text>
      </View>

      <Feather name="map" size={20} color={COLORES.primario} />
    </Pressable>
  );
}
