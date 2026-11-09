import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../src/services/queryClient';

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

/** Layout raíz: Stack principal con áreas seguras y TanStack Query disponibles en toda la app. */
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
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
