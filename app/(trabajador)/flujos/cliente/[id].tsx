import PantallaEnConstruccion from '../../../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../../../src/components/RutaProtegida';
import { ROLES_PERSONAL } from '../../../../src/utils/navegacion';

/** Detalle de cliente, ruta dinámica por id: datos (F5) e historial (F8) (RF-33). Pantalla Stack (título y atrás en el encabezado); la completa F5. */
export default function DetalleCliente() {
  return (
    <RutaProtegida roles={ROLES_PERSONAL}>
      <PantallaEnConstruccion titulo="Detalle de cliente" prompt="F5" tituloEnEncabezado />
    </RutaProtegida>
  );
}
