import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EstadoVista from './EstadoVista';
import type { PantallaEnConstruccionProps } from '../types/props.types';

/**
 * Pantalla de un prompt futuro: muestra su título y "En construcción — [ID del prompt]".
 * Se reemplaza cuando el prompt indicado construye la pantalla real (en C1 no debe quedar ninguna).
 * En las pantallas Stack el título ya está en el encabezado (tituloEnEncabezado) y no se repite.
 */
export default function PantallaEnConstruccion({
  titulo,
  prompt,
  tituloEnEncabezado = false,
}: PantallaEnConstruccionProps) {
  return (
    // SafeAreaView solo agrega el espacio que de verdad tapa el sistema: bajo un encabezado o
    // sobre la barra de pestañas no suma nada.
    <SafeAreaView className="flex-1 bg-fondo">
      {tituloEnEncabezado ? null : (
        <View className="px-pantalla pt-4">
          <Text className="font-titulo text-3xl text-texto">{titulo}</Text>
        </View>
      )}
      <EstadoVista tipo="vacio" mensaje={`En construcción — ${prompt}`} />
    </SafeAreaView>
  );
}
