import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { cerrarSesion } from '../services/auth.service';

/**
 * Cerrar sesión con confirmación (RF-04). Lo usan el Drawer (MenuLateral) y la pantalla Perfil.
 * auth.service.cerrarSesion revoca el token en el servidor y llama a sesionStore.cerrarSesion,
 * que borra la sesión del teléfono y la caché de consultas.
 */
export function useCerrarSesion() {
  const router = useRouter();
  const [cerrando, setCerrando] = useState(false);

  function confirmarCierre() {
    Alert.alert('Cerrar sesión', '¿Quieres cerrar sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          setCerrando(true);
          await cerrarSesion();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return { confirmarCierre, cerrando };
}
