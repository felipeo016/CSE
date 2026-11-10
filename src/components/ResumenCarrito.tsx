import { ActivityIndicator, Text, View } from 'react-native';

import Boton from './Boton';
import { COLORES } from '../config/colores';
import { useCalculoTotal } from '../hooks/useCalculoTotal';
import { NOMBRE_TIPO_SERVICIO } from '../models/Cotizacion';
import type { FilaResumenProps, ResumenCarritoProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';

/** Fila "etiqueta ........ valor" del resumen. */
function FilaResumen({ etiqueta, valor, variante = 'normal' }: FilaResumenProps) {
  const esTotal = variante === 'total';
  return (
    <View className={`flex-row items-center justify-between ${esTotal ? 'pt-3' : 'py-1'}`}>
      <Text
        className={esTotal ? 'font-titulo text-xl text-texto' : 'font-cuerpo text-base text-texto-suave'}
      >
        {etiqueta}
      </Text>
      <Text
        className={
          esTotal
            ? 'font-titulo text-2xl text-primario'
            : `font-cuerpo-medio text-base ${variante === 'descuento' ? 'text-exito' : 'text-texto'}`
        }
      >
        {valor}
      </Text>
    </View>
  );
}

/**
 * Resumen del carrito (mockup, RF-12): subtotal, descuento, IVA, servicio y total.
 * Los valores salen del hook propio useCalculoTotal, el mismo que usará Crear cotización (F6).
 */
export default function ResumenCarrito({ lineas, servicio }: ResumenCarritoProps) {
  // El carrito no lleva descuento (decisión del equipo), así que no se envía descuentoTexto.
  const { desglose, errores, cargando, errorParametros, reintentar } = useCalculoTotal({
    lineas,
    servicio,
  });

  return (
    <View className="mb-bloque rounded-tarjeta border border-borde bg-fondo p-4">
      <Text className="mb-2 font-titulo text-xl text-texto">Resumen</Text>

      {cargando ? (
        <View className="items-center py-4">
          <ActivityIndicator color={COLORES.primario} />
          <Text className="mt-2 font-cuerpo text-sm text-texto-suave">Calculando total…</Text>
        </View>
      ) : null}

      {errorParametros ? (
        <View className="py-2">
          <Text className="mb-3 font-cuerpo text-sm text-error">
            No se pudieron cargar el IVA y las tarifas para calcular el total. {errorParametros}
          </Text>
          <Boton texto="Reintentar" icono="refresh-cw" variante="secundario" onPress={reintentar} />
        </View>
      ) : null}

      {errores.map((error) => (
        <Text key={error} className="py-1 font-cuerpo text-sm text-error">
          {error}
        </Text>
      ))}

      {desglose ? (
        <View>
          <FilaResumen etiqueta="Subtotal" valor={formatearPrecio(desglose.subtotal)} />
          <FilaResumen
            etiqueta="Descuento"
            valor={desglose.descuento > 0 ? `− ${formatearPrecio(desglose.descuento)}` : formatearPrecio(0)}
            variante="descuento"
          />
          <FilaResumen etiqueta={`IVA (${desglose.impuestoPorcentaje} %)`} valor={formatearPrecio(desglose.impuesto)} />
          {servicio ? (
            <FilaResumen
              etiqueta={NOMBRE_TIPO_SERVICIO[servicio]}
              valor={formatearPrecio(desglose.costoServicio)}
            />
          ) : null}
          <View className="mt-2 border-t border-borde">
            <FilaResumen etiqueta="Total" valor={formatearPrecio(desglose.total)} variante="total" />
          </View>
        </View>
      ) : null}
    </View>
  );
}
