import { Drawer } from 'expo-router/drawer';

import BotonMenu from '../../../src/components/BotonMenu';
import MenuLateral from '../../../src/components/MenuLateral';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { OPCIONES_ENCABEZADO_DRAWER } from '../../../src/config/encabezados';
import { OPCIONES_MENU_ADMINISTRADOR, OPCIONES_MENU_TRABAJADOR } from '../../../src/config/menus';
import { useSesionStore } from '../../../src/store/sesionStore';
import { ROLES_PERSONAL } from '../../../src/utils/navegacion';

/**
 * Drawer del trabajador y del administrador (RF-03): Inicio (las pestañas), Ubicaciones, Perfil
 * y Cerrar sesión; el administrador ve además Usuarios y roles (RF-34).
 */
export default function DrawerTrabajador() {
  const esAdministrador = useSesionStore((estado) => estado.usuario?.rol === 'administrador');

  // Solo el administrador ve Usuarios y roles en el menú.
  const opciones = esAdministrador ? OPCIONES_MENU_ADMINISTRADOR : OPCIONES_MENU_TRABAJADOR;

  return (
    <RutaProtegida roles={ROLES_PERSONAL}>
      <Drawer
        screenOptions={({ navigation }) => ({
          ...OPCIONES_ENCABEZADO_DRAWER,
          headerLeft: () => <BotonMenu onPress={() => navigation.toggleDrawer()} />,
        })}
        drawerContent={({ state, navigation }) => (
          <MenuLateral
            opciones={opciones}
            pantallaActual={state.routes[state.index].name}
            onElegir={(pantalla) => {
              navigation.navigate(pantalla);
              navigation.closeDrawer();
            }}
          />
        )}
      >
        <Drawer.Screen name="(tabs)" options={{ title: 'Inicio' }} />
        <Drawer.Screen name="ubicaciones" options={{ title: 'Ubicaciones' }} />
        {/* La pantalla existe para todos, pero se protege por dentro (RutaProtegida de administrador). */}
        <Drawer.Screen name="usuarios" options={{ title: 'Usuarios y roles' }} />
        <Drawer.Screen name="perfil" options={{ title: 'Perfil' }} />
      </Drawer>
    </RutaProtegida>
  );
}
