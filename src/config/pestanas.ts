import { COLORES } from './colores';

/**
 * Estilo común de las barras de pestañas (cliente y trabajador), tomado del mockup:
 * pestaña activa en azul primario, inactivas en gris y etiquetas en Inter.
 */
export const OPCIONES_PESTANAS = {
  // Cada pantalla dibuja su propio título grande, como en el mockup.
  headerShown: false,
  tabBarActiveTintColor: COLORES.primario,
  tabBarInactiveTintColor: COLORES.textoSuave,
  tabBarLabelStyle: { fontFamily: 'Inter-Medium', fontSize: 12 },
  tabBarStyle: { borderTopColor: COLORES.borde },
} as const;
