import { Tabs } from 'expo-router';

import { iconoPestana } from '../../../../src/components/IconoPestana';
import { OPCIONES_PESTANAS } from '../../../../src/config/pestanas';
import { useSesionStore } from '../../../../src/store/sesionStore';

/**
 * Pestañas del trabajador: Productos, Cotizaciones, Clientes y Citas. Van dentro del Drawer.
 * El administrador ve además Panel general (RF-35).
 */
export default function PestanasTrabajador() {
  const esAdministrador = useSesionStore((estado) => estado.usuario?.rol === 'administrador');

  return (
    <Tabs screenOptions={OPCIONES_PESTANAS}>
      <Tabs.Screen name="productos" options={{ title: 'Productos', tabBarIcon: iconoPestana('box') }} />
      <Tabs.Screen
        name="cotizaciones"
        options={{ title: 'Cotizaciones', tabBarIcon: iconoPestana('file-text') }}
      />
      <Tabs.Screen name="clientes" options={{ title: 'Clientes', tabBarIcon: iconoPestana('users') }} />
      <Tabs.Screen name="citas" options={{ title: 'Citas', tabBarIcon: iconoPestana('calendar') }} />
      <Tabs.Screen
        name="panel"
        options={{
          title: 'Panel',
          tabBarIcon: iconoPestana('bar-chart-2'),
          // Al trabajador no se le dibuja el botón de la pestaña, pero la ruta sigue registrada:
          // si escribe /panel a mano, la pantalla muestra "Acceso no autorizado" (RutaProtegida
          // dentro de panel.tsx, CP-12). No se usa href: null porque oculta la ruta y Expo Router
          // redirige a la primera pestaña (Productos) sin ningún mensaje.
          tabBarButton: esAdministrador ? undefined : () => null,
        }}
      />
    </Tabs>
  );
}
