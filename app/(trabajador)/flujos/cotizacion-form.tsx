import PantallaEnConstruccion from '../../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { ROLES_PERSONAL } from '../../../src/utils/navegacion';

/** Crear cotización: cliente, productos, cantidades, cálculo y envío (RF-16 a RF-18). Pantalla Stack (título y atrás en el encabezado); la completa F6. */
export default function CrearCotizacion() {
  return (
    <RutaProtegida roles={ROLES_PERSONAL}>
      <PantallaEnConstruccion titulo="Crear cotización" prompt="F6" tituloEnEncabezado />
    </RutaProtegida>
  );
}
