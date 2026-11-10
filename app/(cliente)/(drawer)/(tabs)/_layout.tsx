import { Tabs } from 'expo-router';

import { iconoPestana } from '../../../../src/components/IconoPestana';
import { COLORES } from '../../../../src/config/colores';
import { OPCIONES_PESTANAS } from '../../../../src/config/pestanas';
import { totalUnidades, useCarritoStore } from '../../../../src/store/carritoStore';

/** Pestañas del cliente: Inicio, Catálogo, Cotizaciones (bandeja) y Carrito. Van dentro del Drawer. */
export default function PestanasCliente() {
  // Zustand: al agregar desde el detalle, el número cambia de inmediato.
  const unidades = useCarritoStore(totalUnidades);

  return (
    <Tabs screenOptions={OPCIONES_PESTANAS}>
      <Tabs.Screen name="inicio" options={{ title: 'Inicio', tabBarIcon: iconoPestana('home') }} />
      <Tabs.Screen name="catalogo" options={{ title: 'Catálogo', tabBarIcon: iconoPestana('grid') }} />
      <Tabs.Screen
        name="cotizaciones"
        options={{ title: 'Cotizaciones', tabBarIcon: iconoPestana('file-text') }}
      />
      <Tabs.Screen
        name="carrito"
        options={{
          title: 'Carrito',
          tabBarIcon: iconoPestana('shopping-cart'),
          // Indicador con las unidades del carrito (RF-11); sin unidades no se muestra.
          tabBarBadge: unidades > 0 ? unidades : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORES.primario },
        }}
      />
    </Tabs>
  );
}
