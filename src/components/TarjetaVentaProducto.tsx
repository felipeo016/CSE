import { Text, View } from 'react-native';

import type { TarjetaVentaProductoProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';

/** "1 unidad" o "3 unidades". */
function unidades(cantidad: number): string {
  return cantidad === 1 ? '1 unidad' : `${cantidad} unidades`;
}

/**
 * Un producto en el Panel general (RF-35), como las columnas del Excel: unidades y ventas a
 * instalador y a cliente final, total vendido y ganancia = (precio de venta − costo) × unidades.
 */
export default function TarjetaVentaProducto({ venta }: TarjetaVentaProductoProps) {
  return (
    <View className="mb-bloque rounded-tarjeta border border-borde bg-fondo p-4">
      <Text className="font-cuerpo-semi text-base text-texto" numberOfLines={2}>
        {venta.nombre}
      </Text>
      {venta.codigo ? <Text className="font-cuerpo text-sm text-texto-suave">{venta.codigo}</Text> : null}

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1 rounded-campo bg-superficie p-3">
          <Text className="font-cuerpo text-sm text-texto-suave">Instalador</Text>
          <Text className="font-cuerpo-semi text-base text-texto">{formatearPrecio(venta.ventasInstalador)}</Text>
          <Text className="font-cuerpo text-sm text-texto-suave">{unidades(venta.unidadesInstalador)}</Text>
        </View>
        <View className="flex-1 rounded-campo bg-superficie p-3">
          <Text className="font-cuerpo text-sm text-texto-suave">Cliente final</Text>
          <Text className="font-cuerpo-semi text-base text-texto">{formatearPrecio(venta.ventasFinal)}</Text>
          <Text className="font-cuerpo text-sm text-texto-suave">{unidades(venta.unidadesFinal)}</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-end justify-between">
        <View>
          <Text className="font-cuerpo text-sm text-texto-suave">Total · {unidades(venta.unidadesTotal)}</Text>
          <Text className="font-titulo-semi text-lg text-texto">{formatearPrecio(venta.ventasTotal)}</Text>
        </View>
        <View className="items-end">
          <Text className="font-cuerpo text-sm text-texto-suave">Ganancia</Text>
          <Text className={`font-titulo-semi text-lg ${venta.ganancia < 0 ? 'text-error' : 'text-exito'}`}>
            {formatearPrecio(venta.ganancia)}
          </Text>
        </View>
      </View>
    </View>
  );
}
