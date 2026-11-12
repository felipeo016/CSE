import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import Boton from '../../../src/components/Boton';
import MapaLeaflet from '../../../src/components/MapaLeaflet';
import { COLORES } from '../../../src/config/colores';
import { COORDENADAS_NEGOCIO } from '../../../src/config/valoresPrueba';
import { formatearCoordenadas } from '../../../src/utils/coordenadas';

/**
 * Ubicación del negocio (RF-23), en el Drawer del cliente. Muestra el negocio en el mapa sin
 * pedir la ubicación del teléfono; el botón abre el Mapa completo en modo negocio, donde están
 * "Mi ubicación" y el seguimiento.
 */
export default function UbicacionNegocio() {
  function abrirMapa() {
    router.push({ pathname: '/(cliente)/flujos/mapa', params: { modo: 'negocio' } });
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
      <View className="px-pantalla pb-bloque pt-4">
        <Text className="font-titulo text-3xl text-texto">Ubicación del negocio</Text>
      </View>

      <View className="mx-pantalla flex-1 overflow-hidden rounded-tarjeta border border-borde">
        <MapaLeaflet negocio={COORDENADAS_NEGOCIO} />
      </View>

      <View className="px-pantalla py-seccion">
        <View className="mb-bloque flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-boton bg-secundario">
            <Feather name="shield" size={22} color={COLORES.fondo} />
          </View>
          <View className="ml-4 flex-1">
            <Text className="font-cuerpo-semi text-lg text-texto">Centro de Seguridad Electrónica</Text>
            <Text className="font-cuerpo text-sm text-texto-suave">
              {formatearCoordenadas(COORDENADAS_NEGOCIO)}
            </Text>
          </View>
        </View>
        <Boton texto="Ver en el mapa con mi ubicación" icono="map" onPress={abrirMapa} />
      </View>
    </SafeAreaView>
  );
}
