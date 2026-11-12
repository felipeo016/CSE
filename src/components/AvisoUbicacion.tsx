import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import Boton from './Boton';
import { COLORES } from '../config/colores';
import type { AvisoUbicacionProps } from '../types/props.types';

/**
 * Tarjeta blanca sobre el mapa (mockup de estados del mapa): permiso negado, GPS apagado o error.
 * Siempre ofrece "Continuar sin ubicación": el mapa y el resto de la app siguen funcionando (RF-24).
 */
export default function AvisoUbicacion({
  icono,
  color,
  titulo,
  detalle,
  accionPrincipal,
  onCerrar,
}: AvisoUbicacionProps) {
  return (
    <View
      className="mx-pantalla items-center rounded-tarjeta bg-fondo p-seccion"
      style={{ elevation: 6, shadowColor: COLORES.texto, shadowOpacity: 0.15, shadowRadius: 12 }}
      accessibilityLiveRegion="polite"
    >
      <View
        className="mb-4 h-20 w-20 items-center justify-center rounded-boton"
        style={{ backgroundColor: `${color}26` }} // el mismo color con 15 % de opacidad
      >
        <Feather name={icono} size={36} color={color} />
      </View>
      <Text className="text-center font-titulo text-2xl text-texto">{titulo}</Text>
      <Text className="mb-seccion mt-2 text-center font-cuerpo text-base text-texto-suave">{detalle}</Text>

      <View className="w-full">
        <Boton texto={accionPrincipal.texto} icono={accionPrincipal.icono} onPress={accionPrincipal.onPress} />
        <View className="mt-bloque">
          <Boton texto="Continuar sin ubicación" variante="secundario" onPress={onCerrar} />
        </View>
      </View>
    </View>
  );
}
