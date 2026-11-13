import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { TarjetaDatoVentaProps, TotalesVentasProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';

/** Tarjeta pequeña con ícono en círculo, número grande y etiqueta (mockup del Panel general). */
function TarjetaDato({ icono, color, valor, etiqueta }: TarjetaDatoVentaProps) {
  return (
    <View className="flex-1 rounded-tarjeta border border-borde bg-fondo p-4">
      <View
        className="mb-2 h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}22` }}
      >
        <Feather name={icono} size={20} color={color} />
      </View>
      <Text className="font-titulo text-xl text-texto" numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text className="font-cuerpo text-sm text-texto-suave">{etiqueta}</Text>
    </View>
  );
}

/**
 * Totales del periodo arriba del Panel general (RF-35): ventas del mes en grande y, debajo,
 * ganancia, unidades y ventas por tipo de cliente. Sin ventas, todo en cero.
 */
export default function ResumenTotalesVentas({ totales }: TotalesVentasProps) {
  return (
    <View>
      {/* Tarjeta principal, como "Ventas del mes" del mockup. */}
      <View className="mb-bloque rounded-tarjeta bg-secundario p-5">
        <Text className="font-cuerpo-semi text-base text-fondo">Ventas del mes</Text>
        <Text className="mt-1 font-titulo text-3xl text-fondo" numberOfLines={1} adjustsFontSizeToFit>
          {formatearPrecio(totales.ventas)}
        </Text>
        <Text className="mt-1 font-cuerpo text-sm text-fondo opacity-80">
          {totales.productosVendidos === 1
            ? '1 producto vendido'
            : `${totales.productosVendidos} productos vendidos`}
        </Text>
      </View>

      <View className="mb-bloque flex-row gap-3">
        <TarjetaDato icono="trending-up" color={COLORES.exito} valor={formatearPrecio(totales.ganancia)} etiqueta="Ganancia" />
        <TarjetaDato icono="package" color={COLORES.primario} valor={String(totales.unidades)} etiqueta="Unidades vendidas" />
      </View>

      <View className="mb-bloque flex-row gap-3">
        <TarjetaDato
          icono="tool"
          color={COLORES.advertencia}
          valor={formatearPrecio(totales.ventasInstalador)}
          etiqueta="Ventas a instalador"
        />
        <TarjetaDato
          icono="user"
          color={COLORES.secundario}
          valor={formatearPrecio(totales.ventasFinal)}
          etiqueta="Ventas a cliente final"
        />
      </View>
    </View>
  );
}
