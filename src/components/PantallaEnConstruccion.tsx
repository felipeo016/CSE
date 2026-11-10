import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EstadoVista from './EstadoVista';
import type { PantallaEnConstruccionProps } from '../types/props.types';

/**
 * Pantalla de un prompt futuro: muestra su título y "En construcción — [ID del prompt]".
 * Se reemplaza cuando el prompt indicado construye la pantalla real (en C1 no debe quedar ninguna).
 */
export default function PantallaEnConstruccion({ titulo, prompt }: PantallaEnConstruccionProps) {
  return (
    // La pestaña ya respeta el área inferior; aquí solo se protege la superior.
    <SafeAreaView edges={['top']} className="flex-1 bg-fondo">
      <View className="px-pantalla pt-4">
        <Text className="font-titulo text-3xl text-texto">{titulo}</Text>
      </View>
      <EstadoVista tipo="vacio" mensaje={`En construcción — ${prompt}`} />
    </SafeAreaView>
  );
}
