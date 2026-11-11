import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import EtiquetaEstadoCotizacion from './EtiquetaEstadoCotizacion';
import { COLORES } from '../config/colores';
import type { TarjetaCotizacionProps } from '../types/props.types';
import { formatearFecha, formatearPrecio } from '../utils/formato';

/**
 * Tarjeta de la lista de cotizaciones del trabajador (mockup de Cotizaciones, RF-19):
 * número, estado, cliente, tipo de servicio, fecha y total.
 * Una solicitud todavía no tiene productos: en lugar del total muestra "Por cotizar" y el botón
 * para convertirla en cotización.
 */
export default function TarjetaCotizacion({ cotizacion, onPress, onCrearCotizacion }: TarjetaCotizacionProps) {
  const esSolicitud = cotizacion.estado === 'solicitada';
  const cliente = cotizacion.cliente?.nombre ?? 'Cliente sin nombre';
  const fecha = formatearFecha(cotizacion.creadoEn);

  return (
    <View className="mb-bloque rounded-tarjeta border border-borde bg-fondo">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${cotizacion.numero}, ${cliente}`}
        className="p-4 active:opacity-80"
      >
        <View className="flex-row items-start justify-between">
          <Text className="mr-2 flex-1 font-titulo-semi text-lg text-texto">{cotizacion.numero}</Text>
          <EtiquetaEstadoCotizacion estado={cotizacion.estado} paraPersonal />
        </View>

        <Text className="mt-1 font-cuerpo-medio text-base text-texto" numberOfLines={1}>
          {cliente}
        </Text>
        <Text className="font-cuerpo text-sm text-texto-suave" numberOfLines={2}>
          {cotizacion.tipoServicioNombre}
          {cotizacion.descripcion ? ` · ${cotizacion.descripcion}` : ''}
        </Text>
        <Text className="mt-1 font-cuerpo text-sm text-texto-suave">{fecha}</Text>

        <Text className="mt-2 font-titulo-semi text-xl text-texto">
          {esSolicitud ? 'Por cotizar' : formatearPrecio(cotizacion.total)}
        </Text>
      </Pressable>

      {esSolicitud && onCrearCotizacion ? (
        <Pressable
          onPress={onCrearCotizacion}
          accessibilityRole="button"
          accessibilityLabel={`Crear cotización a partir de ${cotizacion.numero}`}
          className="h-12 flex-row items-center justify-center border-t border-borde active:opacity-70"
        >
          <Feather name="file-plus" size={18} color={COLORES.primario} style={{ marginRight: 6 }} />
          <Text className="font-cuerpo-semi text-base text-primario">Crear cotización</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
