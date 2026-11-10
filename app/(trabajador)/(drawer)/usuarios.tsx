import PantallaEnConstruccion from '../../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { ROLES_ADMINISTRADOR } from '../../../src/utils/navegacion';

/**
 * Usuarios y roles: crear, editar y desactivar usuarios y asignar rol (RF-34). Opción del Drawer
 * solo del administrador; un cliente o trabajador que escriba la ruta ve "Acceso no autorizado"
 * (CP-12). La completa F8.
 */
export default function UsuariosYRoles() {
  return (
    <RutaProtegida roles={ROLES_ADMINISTRADOR}>
      <PantallaEnConstruccion titulo="Usuarios y roles" prompt="F8" />
    </RutaProtegida>
  );
}
