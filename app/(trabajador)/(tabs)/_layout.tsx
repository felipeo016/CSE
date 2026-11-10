import { Tabs } from 'expo-router';

import { iconoPestana } from '../../../src/components/IconoPestana';
import { OPCIONES_PESTANAS } from '../../../src/config/pestanas';

/** Pestañas del trabajador: Productos, Cotizaciones, Clientes y Citas. J2 las monta dentro del Drawer. */
export default function PestanasTrabajador() {
  return (
    <Tabs screenOptions={OPCIONES_PESTANAS}>
      <Tabs.Screen name="productos" options={{ title: 'Productos', tabBarIcon: iconoPestana('box') }} />
      <Tabs.Screen
        name="cotizaciones"
        options={{ title: 'Cotizaciones', tabBarIcon: iconoPestana('file-text') }}
      />
      <Tabs.Screen name="clientes" options={{ title: 'Clientes', tabBarIcon: iconoPestana('users') }} />
      <Tabs.Screen name="citas" options={{ title: 'Citas', tabBarIcon: iconoPestana('calendar') }} />
    </Tabs>
  );
}
