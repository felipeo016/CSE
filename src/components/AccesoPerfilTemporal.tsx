import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { AccesoPerfilTemporalProps } from '../types/props.types';

/**
 * TEMPORAL hasta J2: botón redondo arriba a la derecha de las pestañas que abre el Perfil.
 * Cuando J2 monte el Drawer (que trae Perfil y Cerrar sesión), se borra este componente
 * y su uso en los _layout de (tabs).
 */
export default function AccesoPerfilTemporal({ ruta }: AccesoPerfilTemporalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => router.push(ruta)}
      accessibilityRole="button"
      accessibilityLabel="Abrir perfil"
      hitSlop={8}
      className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-superficie active:opacity-80"
      // La posición depende del área segura de cada teléfono, por eso va en style.
      style={{ top: insets.top + 12 }}
    >
      <Feather name="user" size={22} color={COLORES.primario} />
    </Pressable>
  );
}
