import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import Boton from '../../../src/components/Boton';
import EstadoVista from '../../../src/components/EstadoVista';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { COLORES } from '../../../src/config/colores';
import { useSesionStore } from '../../../src/store/sesionStore';
import type { FilaResumenProps } from '../../../src/types/props.types';
import { formatearPrecio } from '../../../src/utils/formato';
import { ROLES_CLIENTE } from '../../../src/utils/navegacion';

const RUTA_INICIO = '/(cliente)/(drawer)/(tabs)/inicio';

/** Parámetros que recibe la pantalla (rutaConfirmacionPedido en src/utils/navegacion.ts). */
type ParametrosConfirmacion = {
  pedidoId?: string;
  numero?: string;
  total?: string;
  unidades?: string;
  servicio?: string;
};

/** Convierte un parámetro de la ruta en número; null si no es un número válido y no negativo. */
function numeroDeParametro(valor: string | undefined): number | null {
  if (valor === undefined || valor.trim() === '') {
    return null;
  }
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

/**
 * Confirmación de pedido (RF-13, RF-22). Llega aquí después de que el servidor registró el pedido:
 * al aceptar una cotización (J5) o al confirmar el carrito (J6). Muestra el número y el total que
 * devolvió el servidor y ofrece agendar la cita. No se integra pago real: se marca "Pago simulado".
 */
export default function ConfirmacionPedido() {
  return (
    <RutaProtegida roles={ROLES_CLIENTE}>
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        <ContenidoConfirmacion />
      </SafeAreaView>
    </RutaProtegida>
  );
}

function ContenidoConfirmacion() {
  const parametros = useLocalSearchParams<ParametrosConfirmacion>();
  const nombre = useSesionStore((estado) => estado.usuario?.nombre ?? '');
  const primerNombre = nombre.trim().split(' ')[0] ?? '';

  const numero = parametros.numero?.trim() ?? '';
  const total = numeroDeParametro(parametros.total);
  const unidades = numeroDeParametro(parametros.unidades);
  const servicio = parametros.servicio?.trim() ?? '';

  // Si se abre la ruta sin los datos de un pedido (por ejemplo, escrita a mano), no hay qué confirmar.
  if (!numero || total === null) {
    return (
      <EstadoVista
        tipo="vacio"
        mensaje="No hay un pedido para mostrar"
        detalle="Tus pedidos confirmados aparecen en Mis pedidos."
        accion={{ texto: 'Volver al inicio', onPress: () => router.navigate(RUTA_INICIO) }}
      />
    );
  }

  return (
    <ScrollView contentContainerClassName="px-pantalla pb-seccion pt-seccion">
      <View className="items-center">
        <View className="h-36 w-36 items-center justify-center rounded-full bg-exito/15">
          <View className="h-28 w-28 items-center justify-center rounded-full bg-exito">
            <Feather name="check" size={64} color={COLORES.fondo} />
          </View>
        </View>

        <Text className="mt-seccion text-center font-titulo text-3xl text-texto" accessibilityRole="header">
          ¡Pedido confirmado!
        </Text>
        <Text className="mt-1 text-center font-cuerpo text-base text-texto-suave">
          {primerNombre ? `Gracias por tu compra, ${primerNombre}` : 'Gracias por tu compra'}
        </Text>

        {/* RF-13: no hay pasarela de pago real; la pantalla lo identifica. */}
        <View className="mt-bloque flex-row items-center rounded-boton bg-advertencia/30 px-4 py-2">
          <Feather name="info" size={18} color={COLORES.texto} style={{ marginRight: 8 }} />
          <Text className="font-cuerpo-semi text-base text-texto">Pago simulado</Text>
        </View>
      </View>

      <View className="mt-seccion rounded-tarjeta border border-borde bg-fondo p-4">
        <Fila etiqueta="Pedido" valor={numero} />
        {unidades !== null ? (
          <Fila etiqueta="Productos" valor={`${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`} />
        ) : null}
        {servicio ? <Fila etiqueta={servicio} valor="Por agendar" /> : null}
        <View className="mt-2 flex-row items-center justify-between border-t border-borde pt-3">
          <Text className="font-titulo text-2xl text-texto">Total</Text>
          <Text className="font-titulo text-3xl text-primario">{formatearPrecio(total)}</Text>
        </View>
      </View>

      <View className="mt-seccion">
        {/* Agendar cita lo completa J6; el id del pedido queda en la ruta para entonces. */}
        <Boton
          texto="Agendar cita"
          icono="calendar"
          onPress={() =>
            router.push({
              pathname: '/(cliente)/flujos/agendar-cita',
              params: parametros.pedidoId ? { pedidoId: parametros.pedidoId } : {},
            })
          }
        />
        <View className="mt-bloque">
          <Boton
            texto="Ver mis pedidos"
            variante="secundario"
            onPress={() => router.navigate('/(cliente)/(drawer)/mis-pedidos')}
          />
        </View>
        <View className="mt-bloque">
          <Boton texto="Volver al inicio" variante="secundario" onPress={() => router.navigate(RUTA_INICIO)} />
        </View>
      </View>
    </ScrollView>
  );
}

function Fila({ etiqueta, valor }: FilaResumenProps) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="font-cuerpo text-base text-texto-suave">{etiqueta}</Text>
      <Text className="font-cuerpo-semi text-base text-texto">{valor}</Text>
    </View>
  );
}
