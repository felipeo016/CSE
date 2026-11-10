/**
 * Estilo común de las barras de pestañas (cliente y trabajador), tomado del mockup:
 * pestaña activa en azul primario, inactivas en gris y etiquetas en Inter.
 */
export const OPCIONES_PESTANAS = {
  // Cada pantalla dibuja su propio título grande, como en el mockup.
  headerShown: false,
  tabBarActiveTintColor: '#2563EB',
  tabBarInactiveTintColor: '#64748B',
  tabBarLabelStyle: { fontFamily: 'Inter-Medium', fontSize: 12 },
  tabBarStyle: { borderTopColor: '#E2E8F0' },
} as const;
