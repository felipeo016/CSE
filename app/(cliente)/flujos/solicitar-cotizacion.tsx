import PantallaEnConstruccion from '../../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { ROLES_CLIENTE } from '../../../src/utils/navegacion';

/** Solicitar cotización: tipo de servicio, necesidad y productos de interés (RF-15). Pantalla Stack (título y atrás en el encabezado); la completa F5. */
export default function SolicitarCotizacion() {
  return (
    <RutaProtegida roles={ROLES_CLIENTE}>
      <PantallaEnConstruccion titulo="Solicitar cotización" prompt="F5" tituloEnEncabezado />
    </RutaProtegida>
  );
}
