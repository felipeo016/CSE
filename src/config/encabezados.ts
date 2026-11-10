import { COLORES } from './colores';

/**
 * Encabezado de las pantallas Stack (flujos), tomado del mockup ("← Mapa", "← Editar producto"):
 * fondo blanco sin sombra, flecha atrás y título en Poppins.
 */
export const OPCIONES_ENCABEZADO_STACK = {
  headerShown: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: COLORES.fondo },
  headerTintColor: COLORES.texto,
  headerTitleStyle: { fontFamily: 'Poppins-Bold', fontSize: 22, color: COLORES.texto },
  headerBackButtonDisplayMode: 'minimal',
} as const;

/**
 * Encabezado de las pantallas del Drawer: solo el botón de menú (lo agrega el _layout del Drawer).
 * El título va vacío porque cada pantalla dibuja su propio título grande, como en el mockup.
 */
export const OPCIONES_ENCABEZADO_DRAWER = {
  headerShown: true,
  headerTitle: '',
  headerShadowVisible: false,
  headerStyle: { backgroundColor: COLORES.fondo },
  drawerType: 'front',
} as const;
