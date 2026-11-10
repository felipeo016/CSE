import PantallaEnConstruccion from '../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../src/components/RutaProtegida';
import { ROLES_TODOS } from '../../src/utils/navegacion';

/** Detalle de cotización, ruta dinámica /cotizacion/[id] (RF-21, RF-22). Pantalla Stack (título y atrás en el encabezado); la completa J5. */
export default function DetalleCotizacion() {
  return (
    <RutaProtegida roles={ROLES_TODOS}>
      <PantallaEnConstruccion titulo="Detalle de cotización" prompt="J5" tituloEnEncabezado />
    </RutaProtegida>
  );
}
