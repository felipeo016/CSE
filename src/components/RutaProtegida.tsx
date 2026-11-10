import { View } from 'react-native';
import { Redirect } from 'expo-router';

import EstadoVista from './EstadoVista';
import PantallaAccesoNoAutorizado from './PantallaAccesoNoAutorizado';
import { useRequiereRol } from '../hooks/useRequiereRol';
import type { RutaProtegidaProps } from '../types/props.types';

/**
 * Protección por rol (RF-03, RNF-05). Envuelve el _layout de un grupo o una pantalla:
 * sin sesión lleva a Iniciar sesión; con un rol no permitido muestra "Acceso no autorizado";
 * si el rol sirve, muestra el contenido (children).
 * La seguridad real la da el servidor (RLS): esto evita que la interfaz muestre lo que no corresponde.
 */
export default function RutaProtegida({ roles, children }: RutaProtegidaProps) {
  const { estado } = useRequiereRol(roles);

  if (estado === 'cargando') {
    return (
      <View className="flex-1 bg-fondo">
        <EstadoVista tipo="carga" mensaje="Cargando…" />
      </View>
    );
  }

  if (estado === 'sin-sesion') {
    return <Redirect href="/(auth)/login" />;
  }

  if (estado === 'no-autorizado') {
    return <PantallaAccesoNoAutorizado />;
  }

  return <>{children}</>;
}
