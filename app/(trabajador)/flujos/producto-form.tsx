import PantallaEnConstruccion from '../../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { ROLES_PERSONAL } from '../../../src/utils/navegacion';

/** Formulario de producto: creación o edición, precios e inventario (RF-29, RF-30). Pantalla Stack (título y atrás en el encabezado); la completa J7. */
export default function FormularioProducto() {
  return (
    <RutaProtegida roles={ROLES_PERSONAL}>
      <PantallaEnConstruccion titulo="Formulario de producto" prompt="J7" tituloEnEncabezado />
    </RutaProtegida>
  );
}
