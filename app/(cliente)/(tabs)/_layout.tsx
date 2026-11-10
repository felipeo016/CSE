import { Tabs } from 'expo-router';

import { iconoPestana } from '../../../src/components/IconoPestana';
import { OPCIONES_PESTANAS } from '../../../src/config/pestanas';

/** Pestañas del cliente: Inicio, Catálogo, Cotizaciones (bandeja) y Carrito. J2 las monta dentro del Drawer. */
export default function PestanasCliente() {
  return (
    <Tabs screenOptions={OPCIONES_PESTANAS}>
      <Tabs.Screen name="inicio" options={{ title: 'Inicio', tabBarIcon: iconoPestana('home') }} />
      <Tabs.Screen name="catalogo" options={{ title: 'Catálogo', tabBarIcon: iconoPestana('grid') }} />
      <Tabs.Screen
        name="cotizaciones"
        options={{ title: 'Cotizaciones', tabBarIcon: iconoPestana('file-text') }}
      />
      <Tabs.Screen name="carrito" options={{ title: 'Carrito', tabBarIcon: iconoPestana('shopping-cart') }} />
    </Tabs>
  );
}
