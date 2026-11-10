import { ActivityIndicator, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import Boton from './Boton';
import type { EstadoVistaProps, NombreIcono, TipoEstadoVista } from '../types/props.types';

// Ícono y color de cada estado (la carga usa un indicador en lugar de ícono).
const ICONOS: Record<Exclude<TipoEstadoVista, 'carga'>, { nombre: NombreIcono; color: string }> = {
  error: { nombre: 'alert-circle', color: '#DC2626' },
  vacio: { nombre: 'inbox', color: '#2563EB' },
};

/**
 * Estado de carga, error o vacío de una pantalla con datos remotos (RF-09, RNF-02).
 * La acción es opcional: Reintentar en un error, Limpiar búsqueda o Volver en un vacío.
 */
export default function EstadoVista({ tipo, mensaje, detalle, accion }: EstadoVistaProps) {
  return (
    <View className="flex-1 items-center justify-center px-pantalla py-seccion">
      {tipo === 'carga' ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : (
        <Feather name={ICONOS[tipo].nombre} size={56} color={ICONOS[tipo].color} />
      )}

      <Text className="mt-5 text-center font-titulo-semi text-xl text-texto">{mensaje}</Text>

      {detalle ? (
        <Text className="mt-2 text-center font-cuerpo text-base text-texto-suave">{detalle}</Text>
      ) : null}

      {accion ? (
        <View className="mt-seccion w-full max-w-xs">
          <Boton
            texto={accion.texto}
            onPress={accion.onPress}
            icono={tipo === 'error' ? 'refresh-cw' : undefined}
          />
        </View>
      ) : null}
    </View>
  );
}
