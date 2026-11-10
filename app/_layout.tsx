import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import { OPCIONES_ENCABEZADO_STACK } from '../src/config/encabezados';
import { queryClient } from '../src/services/queryClient';

/**
 * Si la app se abre con un enlace directo a un flujo (por ejemplo /producto/123), debajo queda
 * el Inicio de la app; así el botón atrás lleva al inicio del rol en lugar de cerrar la app.
 */
export const unstable_settings = { initialRouteName: 'index' };

// Mantiene visible el splash hasta que las fuentes terminen de cargar.
SplashScreen.preventAutoHideAsync();

// Fuentes personalizadas del mockup (assets/fonts). Los nombres se usan en tailwind.config.js.
const FUENTES = {
  'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
  'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
  'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
};

/**
 * Layout raíz: Stack principal con áreas seguras y TanStack Query disponibles en toda la app (RF-03).
 * Debajo están el acceso, el Drawer de cada rol (con sus pestañas) y, encima, los flujos Stack con
 * título y flecha atrás, que regresan a la pestaña desde donde se abrieron.
 */
export default function RootLayout() {
  const [fuentesCargadas, errorFuentes] = useFonts(FUENTES);

  // Si la carga falla no se bloquea la app: sigue con la fuente del sistema.
  const listo = fuentesCargadas || errorFuentes !== null;

  useEffect(() => {
    if (errorFuentes) {
      console.warn('No se pudieron cargar las fuentes; se usa la del sistema.', errorFuentes);
    }
    if (listo) {
      SplashScreen.hideAsync();
    }
  }, [listo, errorFuentes]);

  if (!listo) {
    return null; // el splash sigue en pantalla
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />

          {/* Drawer de cada rol, con sus pestañas adentro. Cada uno se protege en su _layout. */}
          <Stack.Screen name="(cliente)/(drawer)" />
          <Stack.Screen name="(trabajador)/(drawer)" />

          {/* Flujos del cliente (sección 6). El mapa lo comparten cliente y trabajador. */}
          <Stack.Screen
            name="(cliente)/flujos/solicitar-cotizacion"
            options={{ ...OPCIONES_ENCABEZADO_STACK, title: 'Solicitar cotización' }}
          />
          <Stack.Screen
            name="(cliente)/flujos/mapa"
            options={{ ...OPCIONES_ENCABEZADO_STACK, title: 'Mapa' }}
          />
          <Stack.Screen
            name="(cliente)/flujos/agendar-cita"
            options={{ ...OPCIONES_ENCABEZADO_STACK, title: 'Agendar cita' }}
          />
          <Stack.Screen
            name="(cliente)/flujos/confirmacion-pedido"
            options={{ ...OPCIONES_ENCABEZADO_STACK, title: 'Confirmación de pedido' }}
          />

          {/* Flujos del trabajador y del administrador. */}
          <Stack.Screen
            name="(trabajador)/flujos/producto-form"
            options={{ ...OPCIONES_ENCABEZADO_STACK, title: 'Formulario de producto' }}
          />
          <Stack.Screen
            name="(trabajador)/flujos/cliente-form"
            options={{ ...OPCIONES_ENCABEZADO_STACK, title: 'Formulario de cliente' }}
          />
          <Stack.Screen
            name="(trabajador)/flujos/cliente/[id]"
            options={{ ...OPCIONES_ENCABEZADO_STACK, title: 'Detalle de cliente' }}
          />
          <Stack.Screen
            name="(trabajador)/flujos/cotizacion-form"
            options={{ ...OPCIONES_ENCABEZADO_STACK, title: 'Crear cotización' }}
          />
          <Stack.Screen
            name="(trabajador)/flujos/ubicacion-form"
            options={{ ...OPCIONES_ENCABEZADO_STACK, title: 'Registrar ubicación' }}
          />

          {/* Rutas dinámicas por identificador, de todos los roles con sesión. */}
          <Stack.Screen
            name="producto/[id]"
            options={{ ...OPCIONES_ENCABEZADO_STACK, title: 'Detalle de producto' }}
          />
          <Stack.Screen
            name="cotizacion/[id]"
            options={{ ...OPCIONES_ENCABEZADO_STACK, title: 'Detalle de cotización' }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
