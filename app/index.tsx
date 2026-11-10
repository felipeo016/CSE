import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import EstadoVista from '../src/components/EstadoVista';
import { useSesionStore } from '../src/store/sesionStore';
import { rutaInicioPorRol } from '../src/utils/navegacion';

/**
 * Inicio de la app (RF-04): espera a que Zustand lea la sesión guardada en AsyncStorage.
 * Sin sesión lleva a Iniciar sesión; con sesión, directo a las pestañas de su rol.
 */
export default function Inicio() {
  const hidratado = useSesionStore((estado) => estado.hidratado);
  const token = useSesionStore((estado) => estado.token);
  const usuario = useSesionStore((estado) => estado.usuario);

  if (!hidratado) {
    return (
      <SafeAreaView className="flex-1 bg-fondo">
        <EstadoVista tipo="carga" mensaje="Cargando…" />
      </SafeAreaView>
    );
  }

  if (!token || !usuario) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={rutaInicioPorRol(usuario.rol)} />;
}
