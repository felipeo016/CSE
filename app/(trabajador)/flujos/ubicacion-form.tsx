import PantallaEnConstruccion from '../../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { ROLES_PERSONAL } from '../../../src/utils/navegacion';

/** Registrar ubicación de servicio a nombre de un cliente (RF-26). Pantalla Stack (título y atrás en el encabezado); la completa J4. */
export default function RegistrarUbicacion() {
  return (
    <RutaProtegida roles={ROLES_PERSONAL}>
      <PantallaEnConstruccion titulo="Registrar ubicación" prompt="J4" tituloEnEncabezado />
    </RutaProtegida>
  );
}
