import { Text, View } from 'react-native';

import type { GraficaVentasProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';
import { formatearPesosCorto, topeDeGrafica } from '../utils/panel';

/** Alto del área de las barras, en píxeles. */
const ALTO_GRAFICA = 140;
/** Máximo de barras: las del mockup (10). */
const MAXIMO_BARRAS = 10;

/**
 * Gráfica de barras del mockup ("Ventas del mes"), hecha solo con View y NativeWind, sin
 * librerías. Una barra por producto vendido (los de más venta primero); el número bajo cada barra
 * es su posición en la lista "Por producto". La altura de cada barra es proporcional a su venta
 * frente al tope del eje (0, 1/3, 2/3 y el tope, como 0, 5M, 10M y 15M del mockup).
 */
export default function GraficaVentas({ productos }: GraficaVentasProps) {
  const barras = productos.slice(0, MAXIMO_BARRAS);
  const tope = topeDeGrafica(Math.max(0, ...barras.map((venta) => venta.ventasTotal)));
  const marcas = [3, 2, 1, 0].map((parte) => (tope * parte) / 3);

  return (
    <View>
      <View className="flex-row">
        {/* Eje con las marcas, de arriba hacia abajo. */}
        <View className="mr-2 w-10 items-end justify-between" style={{ height: ALTO_GRAFICA }}>
          {marcas.map((marca) => (
            <Text key={marca} className="font-cuerpo text-xs text-texto-suave">
              {formatearPesosCorto(marca)}
            </Text>
          ))}
        </View>

        {/* Barras alineadas abajo, sobre líneas guía. */}
        <View className="flex-1" style={{ height: ALTO_GRAFICA }}>
          <View className="absolute inset-0 justify-between">
            {marcas.map((marca) => (
              <View key={marca} className="h-px bg-borde" />
            ))}
          </View>
          <View className="flex-1 flex-row items-end justify-around">
            {barras.map((venta) => (
              <View
                key={venta.productoId}
                accessibilityLabel={`${venta.nombre}: ${formatearPrecio(venta.ventasTotal)}`}
                className="w-5 rounded-t-md bg-primario"
                // Altura mínima de 2 px para que una venta pequeña se alcance a ver.
                style={{ height: Math.max(2, (venta.ventasTotal / tope) * ALTO_GRAFICA) }}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Posición de cada barra en la lista "Por producto". */}
      <View className="mt-1 flex-row">
        <View className="mr-2 w-10" />
        <View className="flex-1 flex-row justify-around">
          {barras.map((venta, indice) => (
            <Text key={venta.productoId} className="w-5 text-center font-cuerpo text-xs text-texto-suave">
              {indice + 1}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}
