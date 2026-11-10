import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import Boton from './Boton';
import { COLORES } from '../config/colores';
import { useSesionStore } from '../store/sesionStore';
import { rutaInicioPorRol } from '../utils/navegacion';

/**
 * "Acceso no autorizado" (RF-34, RNF-05, CP-12): se muestra cuando el rol del usuario no puede abrir
 * la pantalla, también si escribió la ruta a mano. El botón lleva al inicio de su propio rol.
 */
export default function PantallaAccesoNoAutorizado() {
  const router = useRouter();
  const usuario = useSesionStore((estado) => estado.usuario);

  function irAlInicio() {
    // RutaProtegida solo muestra esta pantalla cuando hay usuario; sin él se va a Iniciar sesión.
    router.replace(usuario ? rutaInicioPorRol(usuario.rol) : '/(auth)/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="flex-1 items-center justify-center px-pantalla">
        <Feather name="lock" size={56} color={COLORES.error} />
        <Text className="mt-5 text-center font-titulo-semi text-xl text-texto">
          Acceso no autorizado
        </Text>
        <Text className="mt-2 text-center font-cuerpo text-base text-texto-suave">
          Tu cuenta no tiene permiso para abrir esta pantalla.
        </Text>
        <View className="mt-seccion w-full max-w-xs">
          <Boton texto="Ir al inicio" onPress={irAlInicio} icono="home" />
        </View>
      </View>
    </SafeAreaView>
  );
}
