import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { TarjetaPedidoProps } from '../types/props.types';
import { formatearFecha, formatearPrecio } from '../utils/formato';

/**
 * Tarjeta de un pedido en Mis pedidos (RF-14): número, estado, fecha, origen y total.
 * Mismo estilo que la tarjeta de cotización del mockup.
 */
export default function TarjetaPedido({ pedido, onPress }: TarjetaPedidoProps) {
  const unidades = pedido.unidades === 1 ? '1 unidad' : `${pedido.unidades} unidades`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Pedido ${pedido.numero}, ${pedido.estadoNombre}`}
      className="mb-bloque rounded-tarjeta border border-borde bg-fondo p-4 active:opacity-80"
    >
      <View className="flex-row items-start justify-between">
        <Text className="mr-2 flex-1 font-titulo-semi text-lg text-texto">{pedido.numero}</Text>
        {/* Pendiente es el único estado en esta versión (decisión del equipo). */}
        <View className="rounded-boton bg-advertencia px-3 py-1">
          <Text className="font-cuerpo-semi text-sm text-texto">{pedido.estadoNombre}</Text>
        </View>
      </View>

      <Text className="font-cuerpo text-sm text-texto-suave">
        {pedido.origenNombre}
        {pedido.lineas.length > 0 ? ` · ${unidades}` : ''}
        {pedido.tipoServicioNombre ? ` · ${pedido.tipoServicioNombre}` : ''}
      </Text>
      <Text className="mt-1 font-cuerpo text-sm text-texto-suave">{formatearFecha(pedido.creadoEn)}</Text>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-titulo-semi text-xl text-texto">{formatearPrecio(pedido.total)}</Text>
        <Feather name="chevron-right" size={22} color={COLORES.textoSuave} />
      </View>
    </Pressable>
  );
}
