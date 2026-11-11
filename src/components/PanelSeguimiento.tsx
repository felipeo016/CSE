import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import Boton from './Boton';
import { COLORES } from '../config/colores';
import type { BotonBordeProps, PanelSeguimientoProps } from '../types/props.types';

/** Botón con borde de color (Pausar en naranja, Reanudar en verde, como en el mockup). */
function BotonBorde({ texto, icono, color, habilitado, onPress }: BotonBordeProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!habilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: !habilitado }}
      style={{ borderColor: color }}
      className={`h-14 flex-1 flex-row items-center justify-center rounded-campo border-2 bg-fondo active:opacity-80 ${
        habilitado ? '' : 'opacity-40'
      }`}
    >
      <Feather name={icono} size={20} color={color} style={{ marginRight: 8 }} />
      <Text style={{ color }} className="font-cuerpo-semi text-lg">
        {texto}
      </Text>
    </Pressable>
  );
}

/**
 * Panel inferior del Mapa (mockup): Activar seguimiento, Pausar y Reanudar (RF-25).
 * Solo se puede pulsar lo que tiene sentido en cada estado: pausar si está activo y reanudar si
 * está pausado. El seguimiento solo funciona mientras el mapa está abierto.
 */
export default function PanelSeguimiento({
  seguimiento,
  ocupado,
  onActivar,
  onPausar,
  onReanudar,
}: PanelSeguimientoProps) {
  const activo = seguimiento === 'activo';

  return (
    <View className="rounded-t-tarjeta bg-fondo px-pantalla pb-4 pt-3">
      <View className="mb-3 h-1 w-12 self-center rounded-boton bg-borde" />
      <Text className="font-titulo text-2xl text-texto">Seguimiento</Text>
      <Text className="mb-bloque font-cuerpo text-base text-texto-suave">
        {activo
          ? 'Tu marcador se mueve mientras te desplazas.'
          : 'Sigue tu ubicación en tiempo real mientras estás en el mapa.'}
      </Text>

      <Boton
        texto={activo ? 'Seguimiento activo' : 'Activar seguimiento'}
        icono="map-pin"
        onPress={onActivar}
        cargando={ocupado}
        // Se activa una vez; después se usan Pausar y Reanudar.
        deshabilitado={seguimiento !== 'inactivo'}
      />

      <View className="mt-bloque flex-row gap-3">
        <BotonBorde
          texto="Pausar"
          icono="pause"
          color={COLORES.advertencia}
          habilitado={activo && !ocupado}
          onPress={onPausar}
        />
        <BotonBorde
          texto="Reanudar"
          icono="play"
          color={COLORES.exito}
          habilitado={seguimiento === 'pausado' && !ocupado}
          onPress={onReanudar}
        />
      </View>
    </View>
  );
}
