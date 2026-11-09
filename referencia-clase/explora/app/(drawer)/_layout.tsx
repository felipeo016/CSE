import { Drawer } from 'expo-router/drawer';
import { Colors } from '../../constants/Colors';

export default function DrawerLayout() {
  return <Drawer>
    <Drawer.Screen
      name="(tabs)"
      options={{
        title: 'Lugares para explorar',
        headerTitle: 'Lugares',
        drawerLabel: 'Lugares para explorar',
        headerStyle: { backgroundColor: Colors.encabezado },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    />
    <Drawer.Screen
      name="informacion"
      options={{
        title: 'Información de Explora',
        drawerLabel: 'Información de Explora',
        headerStyle: { backgroundColor: Colors.encabezado },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    />
  </Drawer>;
}
