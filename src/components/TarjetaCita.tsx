import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import Boton from './Boton';
import { EtiquetaEstadoCita, EtiquetaTipoServicio } from './EtiquetasCita';
import { COLORES } from '../config/colores';
import type { DatoConIconoProps, TarjetaCitaProps } from '../types/props.types';
import { formatearFechaCita } from '../utils/citas';

/** Fila con ícono y texto (cliente, dirección, pedido). */
function Dato({ icono, texto }: DatoConIconoProps) {
  return (
    <View className="mt-2 flex-row items-center">
      <Feather name={icono} size={18} color={COLORES.texto} style={{ marginRight: 10 }} />
      <Text className="flex-1 font-cuerpo text-base text-texto" numberOfLines={2}>
        {texto}
      </Text>
    </View>
  );
}

/**
 * Tarjeta de una cita (mockup de Citas): franja a la izquierda y, a la derecha, el tipo de
 * servicio, el estado, la fecha, el cliente (solo personal), la dirección y el pedido asociado.
 * Para el personal, una cita Programada muestra Realizada y Cancelar (RF-28).
 */
export default function TarjetaCita({ cita, paraPersonal = false, onCambiarEstado, cambiando = false }: TarjetaCitaProps) {
  const [inicio, fin] = cita.franja.split('-');
  const puedeCambiar = onCambiarEstado !== undefined && cita.estado === 'programada';

  return (
    <View className="mb-bloque flex-row">
      {/* Franja horaria con la línea de tiempo del mockup. */}
      <View className="mr-3 w-16 items-start pt-4">
        <Text className="font-cuerpo-semi text-base text-texto">{inicio} –</Text>
        <Text className="font-cuerpo-semi text-base text-texto">{fin}</Text>
      </View>

      <View className="flex-1 rounded-tarjeta border border-borde bg-fondo p-4">
        <View className="flex-row items-center justify-between">
          <EtiquetaTipoServicio tipo={cita.tipo} />
          <EtiquetaEstadoCita estado={cita.estado} />
        </View>

        <Dato icono="calendar" texto={formatearFechaCita(cita.fecha)} />
        {paraPersonal ? <Dato icono="user" texto={cita.clienteNombre ?? 'Cliente sin nombre'} /> : null}
        <Dato
          icono="map-pin"
          texto={
            cita.direccion
              ? `${cita.direccion}${cita.referencia ? ` (${cita.referencia})` : ''}`
              : 'Ubicación no disponible'
          }
        />
        {cita.pedidoNumero ? <Dato icono="shopping-bag" texto={`Pedido ${cita.pedidoNumero}`} /> : null}

        {puedeCambiar ? (
          <View className="mt-bloque flex-row gap-3">
            <View className="flex-1">
              <Boton
                texto="Realizada"
                icono="check"
                onPress={() => onCambiarEstado('realizada')}
                cargando={cambiando}
              />
            </View>
            <View className="flex-1">
              <Boton
                texto="Cancelar"
                variante="peligro"
                onPress={() => onCambiarEstado('cancelada')}
                deshabilitado={cambiando}
              />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
