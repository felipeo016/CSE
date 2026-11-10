import PantallaEnConstruccion from '../../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { ROLES_PERSONAL } from '../../../src/utils/navegacion';

/** Formulario de cliente: creación o edición de un cliente (RF-33). Pantalla Stack (título y atrás en el encabezado); la completa F5. */
export default function FormularioCliente() {
  return (
    <RutaProtegida roles={ROLES_PERSONAL}>
      <PantallaEnConstruccion titulo="Formulario de cliente" prompt="F5" tituloEnEncabezado />
    </RutaProtegida>
  );
}
