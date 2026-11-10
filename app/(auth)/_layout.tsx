import { Stack } from 'expo-router';

/** Stack de acceso: Iniciar sesión y Registro. Cada pantalla dibuja su propio encabezado. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
