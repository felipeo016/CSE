import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { TarjetaIndicadorProps } from '../types/props.types';

/**
 * Tarjeta de resumen del Panel general (mockup: ícono en círculo de color, número grande y
 * etiqueta). Tiene su propia carga y su propio error con Reintentar, así una consulta que falla
 * no tapa el resto del panel. Con onPress lleva a su lista (Cotizaciones, Citas o Productos).
 */
export default function TarjetaIndicador({
  icono,
  color,
  etiqueta,
  valor,
  cargando,
  error,
  onReintentar,
  onPress,
}: TarjetaIndicadorProps) {
  function cuerpo() {
    if (cargando) {
      return <ActivityIndicator color={color} style={{ alignSelf: 'flex-start', marginVertical: 6 }} />;
    }
    if (error !== null || valor === null) {
      return (
        <Pressable onPress={onReintentar} accessibilityRole="button" accessibilityLabel={`Reintentar ${etiqueta}`} hitSlop={8}>
          <Text className="font-cuerpo text-sm text-error">No se pudo cargar</Text>
          <Text className="font-cuerpo-semi text-sm text-primario">Reintentar</Text>
        </Pressable>
      );
    }
    return <Text className="font-titulo text-3xl text-texto">{valor}</Text>;
  }

  const sePuedeAbrir = onPress !== undefined && !cargando && error === null;

  return (
    <Pressable
      onPress={onPress}
      disabled={!sePuedeAbrir}
      accessibilityRole={sePuedeAbrir ? 'button' : undefined}
      accessibilityLabel={valor !== null ? `${valor} ${etiqueta}` : etiqueta}
      className="flex-1 rounded-tarjeta border border-borde bg-fondo p-4 active:opacity-80"
    >
      <View className="mb-2 flex-row items-start justify-between">
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}22` }}
        >
          <Feather name={icono} size={20} color={color} />
        </View>
        {sePuedeAbrir ? <Feather name="chevron-right" size={18} color={COLORES.textoSuave} /> : null}
      </View>
      {cuerpo()}
      <Text className="font-cuerpo text-sm text-texto-suave">{etiqueta}</Text>
    </Pressable>
  );
}
