import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { BotonProps, VarianteBoton } from '../types/props.types';

// Clases y color de texto de cada variante, tomados del mockup.
const ESTILOS: Record<VarianteBoton, { contenedor: string; texto: string; color: string }> = {
  primario: { contenedor: 'bg-primario', texto: 'text-white', color: '#FFFFFF' },
  secundario: { contenedor: 'border border-primario bg-fondo', texto: 'text-primario', color: '#2563EB' },
  peligro: { contenedor: 'border border-error bg-fondo', texto: 'text-error', color: '#DC2626' },
};

/** Botón reutilizable con variantes, estado deshabilitado y estado de carga (RF-09). */
export default function Boton({
  texto,
  onPress,
  variante = 'primario',
  deshabilitado = false,
  cargando = false,
  icono,
}: BotonProps) {
  const estilo = ESTILOS[variante];
  // Mientras carga no se puede volver a pulsar: así se evita el doble envío.
  const bloqueado = deshabilitado || cargando;

  return (
    <Pressable
      onPress={onPress}
      disabled={bloqueado}
      accessibilityRole="button"
      accessibilityState={{ disabled: bloqueado, busy: cargando }}
      className={`h-14 flex-row items-center justify-center rounded-boton px-6 active:opacity-80 ${estilo.contenedor} ${
        bloqueado ? 'opacity-50' : ''
      }`}
    >
      {cargando ? (
        <ActivityIndicator color={estilo.color} />
      ) : (
        <View className="flex-row items-center">
          {icono ? <Feather name={icono} size={20} color={estilo.color} style={{ marginRight: 8 }} /> : null}
          <Text className={`font-cuerpo-semi text-lg ${estilo.texto}`}>{texto}</Text>
        </View>
      )}
    </Pressable>
  );
}
