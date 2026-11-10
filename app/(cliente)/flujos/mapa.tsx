import PantallaEnConstruccion from '../../../src/components/PantallaEnConstruccion';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { ROLES_TODOS } from '../../../src/utils/navegacion';

/** Mapa compartido por cliente y trabajador: negocio, posición actual, seguimiento y punto de servicio (RF-23 a RF-26). Pantalla Stack (título y atrás en el encabezado); la completa J4. */
export default function Mapa() {
  return (
    <RutaProtegida roles={ROLES_TODOS}>
      <PantallaEnConstruccion titulo="Mapa" prompt="J4" tituloEnEncabezado />
    </RutaProtegida>
  );
}
