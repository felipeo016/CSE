import type { ColorValue } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { NombreIcono } from '../types/props.types';

const TAMANO_ICONO_PESTANA = 24;

/**
 * Crea el ícono de una pestaña. La barra le pasa el color según si la pestaña está activa o no.
 * Uso: options={{ tabBarIcon: iconoPestana('home') }}
 */
export function iconoPestana(nombre: NombreIcono) {
  return function IconoPestana({ color }: { color: ColorValue }) {
    // La barra entrega el color como texto (COLORES.primario o COLORES.textoSuave, ver src/config/pestanas.ts); si llegara otro tipo, el ícono usa su color por defecto.
    return (
      <Feather
        name={nombre}
        size={TAMANO_ICONO_PESTANA}
        color={typeof color === 'string' ? color : undefined}
      />
    );
  };
}
