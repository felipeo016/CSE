import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Inicio de la app (bienvenida temporal).
 * En J1 esta pantalla revisará la sesión guardada y llevará a Iniciar sesión o a las pestañas del rol.
 */
export default function Inicio() {
  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="flex-1 items-center justify-center px-pantalla">
        <Image
          source={require('../assets/images/logo.png')}
          className="mb-seccion h-32 w-32"
          resizeMode="contain"
          accessibilityLabel="Logo del Centro de Seguridad Electrónica"
        />

        <Text className="font-titulo text-4xl text-texto">Bienvenido</Text>
        <Text className="mt-2 text-center font-cuerpo text-lg text-texto-suave">
          Centro de Seguridad Electrónica
        </Text>

        <View className="mt-seccion w-full items-center rounded-tarjeta border border-borde bg-superficie p-5">
          <Text className="font-cuerpo-semi text-base text-advertencia">En construcción — J1</Text>
          <Text className="mt-1 text-center font-cuerpo text-sm text-texto-suave">
            Aquí estarán el inicio de sesión y el registro.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
