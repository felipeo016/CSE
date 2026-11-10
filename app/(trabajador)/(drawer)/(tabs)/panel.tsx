import PantallaEnConstruccion from '../../../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../../../src/components/RutaProtegida';
import { ROLES_ADMINISTRADOR } from '../../../../src/utils/navegacion';

/**
 * Panel general: ventas y ganancias por producto y periodo (RF-35). Pestaña solo del administrador;
 * un trabajador que abra la ruta ve "Acceso no autorizado". La completa F8.
 */
export default function PanelGeneral() {
  return (
    <RutaProtegida roles={ROLES_ADMINISTRADOR}>
      <PantallaEnConstruccion titulo="Panel general" prompt="F8" />
    </RutaProtegida>
  );
}
