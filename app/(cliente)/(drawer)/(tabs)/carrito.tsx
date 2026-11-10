import { FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import EstadoVista from '../../../../src/components/EstadoVista';
import LineaCarritoItem from '../../../../src/components/LineaCarritoItem';
import ResumenCarrito from '../../../../src/components/ResumenCarrito';
import SelectorServicio from '../../../../src/components/SelectorServicio';
import { totalUnidades, useCarritoStore } from '../../../../src/store/carritoStore';

/**
 * Carrito del cliente (RF-10 a RF-12): líneas con cantidad y Eliminar, servicio de instalación o
 * mantenimiento y resumen del total. El carrito vive en Zustand (carritoStore) y se guarda en
 * AsyncStorage, así sigue ahí al cambiar de pestaña o reabrir la app (RF-11).
 * El botón para confirmar la compra lo agrega J6.
 */
export default function Carrito() {
  const lineas = useCarritoStore((estado) => estado.lineas);
  const servicio = useCarritoStore((estado) => estado.servicio);
  const elegirServicio = useCarritoStore((estado) => estado.elegirServicio);
  const unidades = useCarritoStore(totalUnidades);

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="px-pantalla pb-2 pt-2">
        <Text className="font-titulo text-3xl text-texto">Carrito</Text>
        {lineas.length > 0 ? (
          <Text className="font-cuerpo text-sm text-texto-suave">
            {unidades === 1 ? '1 unidad' : `${unidades} unidades`}
          </Text>
        ) : null}
      </View>

      {lineas.length === 0 ? (
        <EstadoVista
          tipo="vacio"
          mensaje="Tu carrito está vacío"
          detalle="Agrega productos desde el catálogo."
          accion={{
            texto: 'Ir al catálogo',
            onPress: () => router.navigate('/(cliente)/(drawer)/(tabs)/catalogo'),
          }}
        />
      ) : (
        // El teclado no tapa la cantidad que se escribe a mano.
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <FlatList
            data={lineas}
            keyExtractor={(linea) => linea.productoId}
            renderItem={({ item }) => <LineaCarritoItem linea={item} />}
            ListFooterComponent={
              <View>
                <SelectorServicio servicio={servicio} onCambiar={elegirServicio} />
                <ResumenCarrito lineas={lineas} servicio={servicio} />
              </View>
            }
            contentContainerClassName="px-pantalla pb-seccion"
            keyboardShouldPersistTaps="handled"
          />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
