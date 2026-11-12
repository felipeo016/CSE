import { Text, View } from 'react-native';

import type { FilaResumenProps, TotalesCotizacionProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';

/** Fila "etiqueta ........ valor". El descuento va en verde, como en el mockup. */
function Fila({ etiqueta, valor, variante = 'normal' }: FilaResumenProps) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="font-cuerpo text-base text-texto-suave">{etiqueta}</Text>
      <Text
        className={`font-cuerpo-semi text-base ${variante === 'descuento' ? 'text-exito' : 'text-texto'}`}
      >
        {valor}
      </Text>
    </View>
  );
}

/**
 * Totales del detalle de cotización (mockup, RF-21): subtotal, descuento, IVA, servicio y total.
 * Los valores son los que guardó el servidor; la app no los recalcula. No hay costo ni ganancia:
 * el modelo Cotizacion no tiene esos campos (RNF-06).
 */
export default function TotalesCotizacion({ cotizacion }: TotalesCotizacionProps) {
  return (
    <View className="mb-bloque rounded-tarjeta border border-borde bg-fondo p-4">
      <Fila etiqueta="Subtotal" valor={formatearPrecio(cotizacion.subtotal)} />
      <Fila
        etiqueta="Descuento"
        valor={cotizacion.descuento > 0 ? `− ${formatearPrecio(cotizacion.descuento)}` : formatearPrecio(0)}
        variante={cotizacion.descuento > 0 ? 'descuento' : 'normal'}
      />
      <Fila etiqueta="IVA" valor={formatearPrecio(cotizacion.impuesto)} />
      {cotizacion.incluyeServicio ? (
        <Fila etiqueta={cotizacion.tipoServicioNombre} valor={formatearPrecio(cotizacion.valorServicio)} />
      ) : null}

      <View className="mt-2 flex-row items-center justify-between border-t border-borde pt-3">
        <Text className="font-titulo text-2xl text-texto">Total</Text>
        <Text className="font-titulo text-3xl text-primario">{formatearPrecio(cotizacion.total)}</Text>
      </View>
    </View>
  );
}
