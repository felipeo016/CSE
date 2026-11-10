import { View } from 'react-native';
import { Tabs } from 'expo-router';

import AccesoPerfilTemporal from '../../../src/components/AccesoPerfilTemporal';
import { iconoPestana } from '../../../src/components/IconoPestana';
import { OPCIONES_PESTANAS } from '../../../src/config/pestanas';

/** Pestañas del trabajador: Productos, Cotizaciones, Clientes y Citas. J2 las monta dentro del Drawer. */
export default function PestanasTrabajador() {
  return (
    <View className="flex-1">
      <Tabs screenOptions={OPCIONES_PESTANAS}>
        <Tabs.Screen name="productos" options={{ title: 'Productos', tabBarIcon: iconoPestana('box') }} />
        <Tabs.Screen
          name="cotizaciones"
          options={{ title: 'Cotizaciones', tabBarIcon: iconoPestana('file-text') }}
        />
        <Tabs.Screen name="clientes" options={{ title: 'Clientes', tabBarIcon: iconoPestana('users') }} />
        <Tabs.Screen name="citas" options={{ title: 'Citas', tabBarIcon: iconoPestana('calendar') }} />
      </Tabs>
      {/* TEMPORAL hasta J2: acceso a Perfil mientras no existe el Drawer. */}
      <AccesoPerfilTemporal ruta="/(trabajador)/perfil" />
    </View>
  );
}
