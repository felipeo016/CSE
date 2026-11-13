import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import Boton from './Boton';
import { COLORES } from '../config/colores';
import type { AvisoErrorAccionProps } from '../types/props.types';

/**
 * Recuadro rojo con el error de una acción que no se completó (comprar, agendar...). Si la acción
 * se puede repetir, muestra Reintentar (RNF-08): sin conexión no se creó nada y, al volver la
 * conexión, Reintentar la completa.
 */
export default function AvisoErrorAccion({
  titulo,
  mensaje,
  sinConexion = false,
  onReintentar,
  reintentando = false,
}: AvisoErrorAccionProps) {
  return (
    <View className="mb-bloque rounded-tarjeta border border-error bg-error/10 p-4" accessibilityLiveRegion="polite">
      <View className="flex-row items-center">
        <Feather
          name={sinConexion ? 'wifi-off' : 'alert-circle'}
          size={20}
          color={COLORES.error}
          style={{ marginRight: 8 }}
        />
        <Text className="flex-1 font-cuerpo-semi text-base text-error">{titulo}</Text>
      </View>
      <Text className="mt-1 font-cuerpo text-base text-texto">{mensaje}</Text>
      {onReintentar ? (
        <View className="mt-bloque">
          <Boton
            texto="Reintentar"
            icono="refresh-cw"
            variante="secundario"
            cargando={reintentando}
            onPress={onReintentar}
          />
        </View>
      ) : null}
    </View>
  );
}
