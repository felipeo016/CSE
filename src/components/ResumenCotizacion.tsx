import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { COLORES } from '../config/colores';
import { NOMBRE_TIPO_SERVICIO } from '../models/Cotizacion';
import type { FilaResumenProps, ResumenCotizacionProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';

/** Fila "etiqueta ........ valor" sobre el fondo azul marino (aquí no se usa la variante). */
function Fila({ etiqueta, valor }: FilaResumenProps) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="font-cuerpo text-base text-fondo">{etiqueta}</Text>
      <Text className="font-cuerpo-medio text-base text-fondo">{valor}</Text>
    </View>
  );
}

/**
 * Resumen de la cotización (mockup de Crear cotización: tarjeta azul marino). Muestra lo que
 * calcula useCalculoTotal con la fórmula de la sección 5, la misma del servidor; se recalcula con
 * cada cambio de cantidad, descuento o costo del servicio (RF-17).
 */
export default function ResumenCotizacion({ calculo, servicio }: ResumenCotizacionProps) {
  const { desglose, errores, cargando, errorParametros, reintentar } = calculo;

  return (
    <View className="mb-bloque rounded-tarjeta bg-secundario p-4" accessibilityLiveRegion="polite">
      {cargando ? (
        <View className="items-center py-4">
          <ActivityIndicator color={COLORES.fondo} />
          <Text className="mt-2 font-cuerpo text-sm text-fondo">Calculando total…</Text>
        </View>
      ) : null}

      {errorParametros ? (
        <View className="py-2">
          <Text className="mb-2 font-cuerpo text-sm text-fondo">
            No se pudieron cargar el IVA y las tarifas para calcular el total. {errorParametros}
          </Text>
          <Pressable onPress={reintentar} accessibilityRole="button" hitSlop={8}>
            <Text className="font-cuerpo-semi text-base text-fondo underline">Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {!cargando && !errorParametros && !desglose ? (
        <Text className="py-2 font-cuerpo text-sm text-fondo">
          {errores.length > 0
            ? 'Corrige los valores marcados para ver el total.'
            : 'Agrega productos para ver el total.'}
        </Text>
      ) : null}

      {desglose ? (
        <View>
          <Fila etiqueta="Subtotal" valor={formatearPrecio(desglose.subtotal)} />
          <Fila
            etiqueta="Descuento"
            valor={desglose.descuento > 0 ? `− ${formatearPrecio(desglose.descuento)}` : formatearPrecio(0)}
          />
          <Fila
            etiqueta={`IVA (${desglose.impuestoPorcentaje} %)`}
            valor={formatearPrecio(desglose.impuesto)}
          />
          {servicio ? (
            <Fila etiqueta={NOMBRE_TIPO_SERVICIO[servicio]} valor={formatearPrecio(desglose.costoServicio)} />
          ) : null}
          <View className="mt-2 flex-row items-center justify-between border-t border-fondo/40 pt-3">
            <Text className="font-titulo text-2xl text-fondo">Total</Text>
            <Text className="font-titulo text-3xl text-fondo">{formatearPrecio(desglose.total)}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
