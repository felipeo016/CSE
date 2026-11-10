import { Text, View } from 'react-native';

import type { EtiquetaDisponibilidadProps } from '../types/props.types';

/** Etiqueta del mockup: verde "Disponibles: N" o roja "Agotado" cuando no hay unidades (RF-10). */
export default function EtiquetaDisponibilidad({ inventario }: EtiquetaDisponibilidadProps) {
  const agotado = inventario <= 0;
  return (
    <View
      className={`self-start rounded-boton px-3 py-1 ${agotado ? 'bg-error/10' : 'bg-exito/15'}`}
    >
      <Text className={`font-cuerpo-semi text-sm ${agotado ? 'text-error' : 'text-exito'}`}>
        {agotado ? 'Agotado' : `Disponibles: ${inventario}`}
      </Text>
    </View>
  );
}
