import { Redirect } from 'expo-router';

/**
 * Inicio de la app. Por ahora siempre lleva a Iniciar sesión.
 * F3 le agrega la revisión de la sesión guardada para abrir directamente las pestañas del rol (RF-04).
 */
export default function Inicio() {
  return <Redirect href="/(auth)/login" />;
}
