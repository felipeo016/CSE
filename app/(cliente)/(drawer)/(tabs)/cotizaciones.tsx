import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import Boton from '../../../../src/components/Boton';
import EstadoVista from '../../../../src/components/EstadoVista';

/**
 * Bandeja de cotizaciones del cliente (RF-20). La completa J5.
 * F5 solo agrega el acceso a Solicitar cotización (RF-15).
 */
export default function BandejaCotizaciones() {
  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="px-pantalla pt-4">
        <Text className="font-titulo text-3xl text-texto">Cotizaciones</Text>
        <View className="mt-bloque">
          <Boton
            texto="Solicitar cotización"
            icono="file-plus"
            onPress={() => router.push('/(cliente)/flujos/solicitar-cotizacion')}
          />
        </View>
      </View>
      <EstadoVista tipo="vacio" mensaje="En construcción — J5" />
    </SafeAreaView>
  );
}
