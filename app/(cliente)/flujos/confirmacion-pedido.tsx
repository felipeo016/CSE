import PantallaEnConstruccion from '../../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { ROLES_CLIENTE } from '../../../src/utils/navegacion';

/** Confirmación de pedido: número del pedido y opción de agendar la cita (RF-13, RF-22). Pantalla Stack (título y atrás en el encabezado); la completa J5. */
export default function ConfirmacionPedido() {
  return (
    <RutaProtegida roles={ROLES_CLIENTE}>
      <PantallaEnConstruccion titulo="Confirmación de pedido" prompt="J5" tituloEnEncabezado />
    </RutaProtegida>
  );
}
