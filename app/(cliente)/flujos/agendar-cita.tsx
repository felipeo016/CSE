import PantallaEnConstruccion from '../../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { ROLES_CLIENTE } from '../../../src/utils/navegacion';

/** Agendar cita: tipo de servicio, fecha, franja y ubicación (RF-27). Pantalla Stack (título y atrás en el encabezado); la completa J6. */
export default function AgendarCita() {
  return (
    <RutaProtegida roles={ROLES_CLIENTE}>
      <PantallaEnConstruccion titulo="Agendar cita" prompt="J6" tituloEnEncabezado />
    </RutaProtegida>
  );
}
