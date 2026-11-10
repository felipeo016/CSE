import { Drawer } from 'expo-router/drawer';

import BotonMenu from '../../../src/components/BotonMenu';
import MenuLateral from '../../../src/components/MenuLateral';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { OPCIONES_ENCABEZADO_DRAWER } from '../../../src/config/encabezados';
import { OPCIONES_MENU_CLIENTE } from '../../../src/config/menus';
import { ROLES_CLIENTE } from '../../../src/utils/navegacion';

/**
 * Drawer del cliente (RF-03): Inicio (las pestañas), Mis pedidos, Mis citas, Mis ubicaciones,
 * Ubicación del negocio, Perfil y Cerrar sesión. Solo lo abre un cliente (RNF-05).
 * Los flujos (solicitar cotización, mapa...) están en el Stack raíz, encima de este Drawer.
 */
export default function DrawerCliente() {
  return (
    <RutaProtegida roles={ROLES_CLIENTE}>
      <Drawer
        // Cada pantalla tiene el botón de menú a la izquierda del encabezado.
        screenOptions={({ navigation }) => ({
          ...OPCIONES_ENCABEZADO_DRAWER,
          headerLeft: () => <BotonMenu onPress={() => navigation.toggleDrawer()} />,
        })}
        // Contenido propio del menú: datos del usuario, opciones del rol y Cerrar sesión.
        drawerContent={({ state, navigation }) => (
          <MenuLateral
            opciones={OPCIONES_MENU_CLIENTE}
            pantallaActual={state.routes[state.index].name}
            onElegir={(pantalla) => {
              navigation.navigate(pantalla);
              navigation.closeDrawer();
            }}
          />
        )}
      >
        <Drawer.Screen name="(tabs)" options={{ title: 'Inicio' }} />
        <Drawer.Screen name="mis-pedidos" options={{ title: 'Mis pedidos' }} />
        <Drawer.Screen name="mis-citas" options={{ title: 'Mis citas' }} />
        <Drawer.Screen name="mis-ubicaciones" options={{ title: 'Mis ubicaciones' }} />
        <Drawer.Screen name="ubicacion-negocio" options={{ title: 'Ubicación del negocio' }} />
        <Drawer.Screen name="perfil" options={{ title: 'Perfil' }} />
      </Drawer>
    </RutaProtegida>
  );
}
