import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import Boton from './Boton';
import { COLORES } from '../config/colores';
import type { TarjetaResumenInicioProps } from '../types/props.types';

/**
 * Tarjeta de resumen del Inicio del cliente (cotizaciones nuevas, próxima cita). Cada tarjeta
 * tiene su propio estado de carga y de error con Reintentar, así una falla no tapa el resto.
 */
export default function TarjetaResumenInicio({
  titulo,
  icono,
  cargando,
  error,
  onReintentar,
  onPress,
  children,
}: TarjetaResumenInicioProps) {
  function cuerpo() {
    if (cargando) {
      return (
        <View className="flex-row items-center py-2">
          <ActivityIndicator color={COLORES.primario} />
          <Text className="ml-3 font-cuerpo text-base text-texto-suave">Cargando…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View className="py-1">
          <Text className="mb-2 font-cuerpo text-sm text-error">{error}</Text>
          <Boton texto="Reintentar" icono="refresh-cw" variante="secundario" onPress={onReintentar} />
        </View>
      );
    }
    return children;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || cargando || error !== null}
      accessibilityRole={onPress ? 'button' : undefined}
      className="mb-bloque rounded-tarjeta border border-borde bg-fondo p-4 active:opacity-80"
    >
      <View className="mb-2 flex-row items-center">
        <Feather name={icono} size={20} color={COLORES.primario} style={{ marginRight: 10 }} />
        <Text className="flex-1 font-titulo-semi text-lg text-texto">{titulo}</Text>
        {onPress ? <Feather name="chevron-right" size={20} color={COLORES.textoSuave} /> : null}
      </View>
      {cuerpo()}
    </Pressable>
  );
}
