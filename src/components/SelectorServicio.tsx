import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import { useParametros } from '../hooks/useParametros';
import { NOMBRE_TIPO_SERVICIO } from '../models/Cotizacion';
import type { ServicioCarrito } from '../models/Carrito';
import type { SelectorServicioProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';

const OPCIONES: readonly ServicioCarrito[] = [null, 'instalacion', 'mantenimiento'];

/**
 * Elegir si la compra lleva instalación o mantenimiento (RF-12). Muestra la tarifa de cada uno,
 * tomada de los parámetros del negocio; el resumen la suma al total.
 */
export default function SelectorServicio({ servicio, onCambiar }: SelectorServicioProps) {
  const parametros = useParametros();

  function tarifa(opcion: ServicioCarrito): string | null {
    if (opcion === null || !parametros.data) {
      return null;
    }
    return formatearPrecio(
      opcion === 'instalacion' ? parametros.data.tarifaInstalacion : parametros.data.tarifaMantenimiento,
    );
  }

  return (
    <View className="mb-bloque rounded-tarjeta border border-borde bg-fondo p-4">
      <Text className="mb-2 font-titulo text-xl text-texto">Servicio</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Servicio con la compra">
        {OPCIONES.map((opcion) => {
          const elegida = opcion === servicio;
          const precio = tarifa(opcion);
          return (
            <Pressable
              key={opcion ?? 'ninguno'}
              onPress={() => onCambiar(opcion)}
              accessibilityRole="radio"
              accessibilityState={{ checked: elegida }}
              className="h-12 flex-row items-center active:opacity-70"
            >
              <Feather
                name={elegida ? 'check-circle' : 'circle'}
                size={22}
                color={elegida ? COLORES.primario : COLORES.textoSuave}
                style={{ marginRight: 10 }}
              />
              <Text className="flex-1 font-cuerpo-medio text-base text-texto">
                {opcion === null ? 'Sin servicio' : NOMBRE_TIPO_SERVICIO[opcion]}
              </Text>
              {precio ? <Text className="font-cuerpo text-base text-texto-suave">+ {precio}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
