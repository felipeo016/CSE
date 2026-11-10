import PantallaEnConstruccion from '../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../src/components/RutaProtegida';
import { ROLES_TODOS } from '../../src/utils/navegacion';

/** Detalle de producto, ruta dinámica /producto/[id] (RF-08). Pantalla Stack (título y atrás en el encabezado); la completa J3. */
export default function DetalleProducto() {
  return (
    <RutaProtegida roles={ROLES_TODOS}>
      <PantallaEnConstruccion titulo="Detalle de producto" prompt="J3" tituloEnEncabezado />
    </RutaProtegida>
  );
}
