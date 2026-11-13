import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import AvisoConexion from '../../../../src/components/AvisoConexion';
import Boton from '../../../../src/components/Boton';
import EstadoVista from '../../../../src/components/EstadoVista';
import RutaProtegida from '../../../../src/components/RutaProtegida';
import { COLORES } from '../../../../src/config/colores';
import { usePedido } from '../../../../src/hooks/usePedidos';
import type {
  ContenidoPorIdProps,
  FilaResumenProps,
  LineaPedidoItemProps,
} from '../../../../src/types/props.types';
import { formatearFecha, formatearPrecio } from '../../../../src/utils/formato';
import { ROLES_CLIENTE } from '../../../../src/utils/navegacion';

const RUTA_MIS_PEDIDOS = '/(cliente)/(drawer)/mis-pedidos';

/**
 * Detalle de pedido (Mis pedidos, RF-14): número, fecha, estado, líneas y totales que guardó el
 * servidor. No hay costo ni ganancia (RNF-06). Un id inexistente o de otro cliente muestra
 * "Pedido no encontrado". Ofrece agendar la cita asociada a este pedido (RF-27).
 */
export default function DetallePedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RutaProtegida roles={ROLES_CLIENTE}>
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        <ContenidoPedido id={id} />
      </SafeAreaView>
    </RutaProtegida>
  );
}

function ContenidoPedido({ id }: ContenidoPorIdProps) {
  const consulta = usePedido(id);
  const pedido = consulta.data ?? null;

  if (consulta.isPending) {
    return <EstadoVista tipo="carga" mensaje="Cargando pedido…" />;
  }
  if (consulta.isError && consulta.data === undefined) {
    return (
      <EstadoVista
        tipo="error"
        mensaje="No se pudo cargar el pedido"
        detalle={consulta.sinConexion ? 'Revisa tu conexión e inténtalo de nuevo' : consulta.error.mensaje}
        accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
      />
    );
  }
  if (!pedido) {
    return (
      <EstadoVista
        tipo="vacio"
        mensaje="Pedido no encontrado"
        detalle="Revisa tus pedidos en Mis pedidos."
        accion={{ texto: 'Ver mis pedidos', onPress: () => router.navigate(RUTA_MIS_PEDIDOS) }}
      />
    );
  }

  return (
    <ScrollView
      contentContainerClassName="px-pantalla pb-seccion pt-4"
      refreshControl={
        <RefreshControl
          refreshing={consulta.isRefetching}
          onRefresh={() => {
            void consulta.refetch();
          }}
          colors={[COLORES.primario]}
        />
      }
    >
      {consulta.mostrandoCache ? (
        <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
      ) : null}

      <View className="flex-row items-start justify-between">
        <Text className="mr-2 flex-1 font-titulo text-3xl text-texto">{pedido.numero}</Text>
        <View className="mt-2 rounded-boton bg-advertencia px-3 py-1">
          <Text className="font-cuerpo-semi text-sm text-texto">{pedido.estadoNombre}</Text>
        </View>
      </View>
      <Text className="font-cuerpo text-base text-texto-suave">
        {formatearFecha(pedido.creadoEn)} · {pedido.origenNombre}
      </Text>

      <Text className="mb-2 mt-seccion font-titulo text-xl text-texto">Productos</Text>
      <View className="mb-bloque rounded-tarjeta border border-borde bg-fondo px-4">
        {pedido.lineas.length === 0 ? (
          <Text className="py-4 font-cuerpo text-base text-texto-suave">Este pedido no tiene productos.</Text>
        ) : (
          pedido.lineas.map((linea, indice) => (
            <LineaPedidoItem key={linea.id} linea={linea} ultima={indice === pedido.lineas.length - 1} />
          ))
        )}
      </View>

      <View className="mb-bloque rounded-tarjeta border border-borde bg-fondo p-4">
        <Fila etiqueta="Subtotal" valor={formatearPrecio(pedido.subtotal)} />
        <Fila
          etiqueta="Descuento"
          valor={pedido.descuento > 0 ? `− ${formatearPrecio(pedido.descuento)}` : formatearPrecio(0)}
          variante={pedido.descuento > 0 ? 'descuento' : 'normal'}
        />
        <Fila etiqueta="IVA" valor={formatearPrecio(pedido.impuesto)} />
        {pedido.tipoServicioNombre ? (
          <Fila etiqueta={pedido.tipoServicioNombre} valor={formatearPrecio(pedido.valorServicio)} />
        ) : null}
        <View className="mt-2 flex-row items-center justify-between border-t border-borde pt-3">
          <Text className="font-titulo text-2xl text-texto">Total</Text>
          <Text className="font-titulo text-3xl text-primario">{formatearPrecio(pedido.total)}</Text>
        </View>
      </View>

      <Boton
        texto="Agendar cita"
        icono="calendar"
        onPress={() =>
          router.push({ pathname: '/(cliente)/flujos/agendar-cita', params: { pedidoId: pedido.id } })
        }
      />
    </ScrollView>
  );
}

/** Una línea: nombre, código, cantidad × precio y subtotal. */
function LineaPedidoItem({ linea, ultima }: LineaPedidoItemProps) {
  return (
    <View className={`py-3 ${ultima ? '' : 'border-b border-borde'}`}>
      <Text className="font-cuerpo-semi text-base text-texto">{linea.nombre}</Text>
      {linea.codigo ? <Text className="font-cuerpo text-sm text-texto-suave">{linea.codigo}</Text> : null}
      <View className="mt-1 flex-row items-center justify-between">
        <Text className="font-cuerpo text-sm text-texto-suave">
          {linea.cantidad} × {formatearPrecio(linea.precioUnitario)}
        </Text>
        <Text className="font-cuerpo-semi text-base text-texto">{formatearPrecio(linea.subtotal)}</Text>
      </View>
    </View>
  );
}

function Fila({ etiqueta, valor, variante = 'normal' }: FilaResumenProps) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="font-cuerpo text-base text-texto-suave">{etiqueta}</Text>
      <Text className={`font-cuerpo-semi text-base ${variante === 'descuento' ? 'text-exito' : 'text-texto'}`}>
        {valor}
      </Text>
    </View>
  );
}
