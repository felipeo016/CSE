/**
 * Colores del tema para usar en JavaScript, donde no llegan las clases de NativeWind:
 * color de íconos, tabBarActiveTintColor, ActivityIndicator, placeholderTextColor...
 * Son los mismos valores de tailwind.config.js (theme.extend.colors). Si cambia uno, cambia el otro.
 * En los estilos con className se usan las clases del tema: bg-primario, text-texto-suave...
 */
export const COLORES = {
  primario: '#2563EB',
  secundario: '#0F2A5C',
  fondo: '#FFFFFF',
  superficie: '#F1F4F9',
  texto: '#0B1F44',
  textoSuave: '#64748B',
  borde: '#E2E8F0',
  error: '#DC2626',
  exito: '#16A34A',
  advertencia: '#F59E0B',
} as const;
