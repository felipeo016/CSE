import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import EtiquetaEstadoCotizacion from './EtiquetaEstadoCotizacion';
import { COLORES } from '../config/colores';
import { esCotizacionPersonal, TEXTO_POR_COTIZAR } from '../models/Cotizacion';
import type { TarjetaCotizacionProps } from '../types/props.types';
import { formatearFecha, formatearPrecio } from '../utils/formato';

/**
 * Tarjeta de una cotización en la lista (mockup de Cotizaciones). La usan las dos listas:
 * - Trabajador (RF-19): número, estado, cliente, tipo de servicio, fecha y total. Una solicitud
 *   todavía no tiene productos: muestra "Por cotizar" y el botón para convertirla en cotización.
 * - Cliente, bandeja (RF-20): número, estado, servicio, fecha y total. Las Nuevas (no leídas) llevan
 *   el punto azul y el número en negrita; las que aún no le envían muestran "Por cotizar".
 */
export default function TarjetaCotizacion({ cotizacion, onPress, onCrearCotizacion }: TarjetaCotizacionProps) {
  const personal = esCotizacionPersonal(cotizacion);
  const esSolicitud = cotizacion.estado === 'solicitada';
  // "Por cotizar" en lugar del total. Se decide con el estado y con totalDisponible (lo que
  // envió el servidor), nunca con las líneas: la lista puede no traerlas.
  // - Personal: solicitud, o el servidor no envió el total (ve el total de un borrador).
  // - Cliente: porCotizar del mapper (Solicitada, Borrador o sin total).
  const sinTotal = personal ? esSolicitud || !cotizacion.totalDisponible : cotizacion.porCotizar;
  const noLeida = !personal && cotizacion.noLeida && !cotizacion.porCotizar;
  const cliente = personal ? cotizacion.cliente?.nombre ?? 'Cliente sin nombre' : null;
  const fecha = formatearFecha(cotizacion.creadoEn);

  // Lo que lee el lector de pantalla al llegar a la tarjeta.
  const etiquetaAccesible = [cotizacion.numero, cliente, noLeida ? 'no leída' : null]
    .filter((parte) => parte !== null)
    .join(', ');

  return (
    <View
      className={`mb-bloque rounded-tarjeta border bg-fondo ${noLeida ? 'border-primario' : 'border-borde'}`}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={etiquetaAccesible}
        className="p-4 active:opacity-80"
      >
        <View className="flex-row items-start justify-between">
          <View className="mr-2 flex-1 flex-row items-center">
            {noLeida ? <View className="mr-2 h-3 w-3 rounded-full bg-primario" /> : null}
            <Text
              className={`flex-1 text-lg text-texto ${noLeida ? 'font-titulo' : 'font-titulo-semi'}`}
            >
              {cotizacion.numero}
            </Text>
          </View>
          <EtiquetaEstadoCotizacion
            estado={cotizacion.estado}
            paraPersonal={personal}
            porCotizar={cotizacion.porCotizar}
          />
        </View>

        {cliente !== null ? (
          <Text className="mt-1 font-cuerpo-medio text-base text-texto" numberOfLines={1}>
            {cliente}
          </Text>
        ) : null}
        <Text className="font-cuerpo text-sm text-texto-suave" numberOfLines={2}>
          {cotizacion.tipoServicioNombre}
          {cotizacion.descripcion ? ` · ${cotizacion.descripcion}` : ''}
        </Text>
        <Text className="mt-1 font-cuerpo text-sm text-texto-suave">{fecha}</Text>

        <Text className="mt-2 font-titulo-semi text-xl text-texto">
          {sinTotal ? TEXTO_POR_COTIZAR : formatearPrecio(cotizacion.total)}
        </Text>
      </Pressable>

      {personal && esSolicitud && onCrearCotizacion ? (
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
