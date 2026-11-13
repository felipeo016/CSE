import type { ReactNode } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import AvisoConexion from '../../../src/components/AvisoConexion';
import EstadoVista from '../../../src/components/EstadoVista';
import TarjetaPedido from '../../../src/components/TarjetaPedido';
import { COLORES } from '../../../src/config/colores';
import { usePedidosCliente } from '../../../src/hooks/usePedidos';
import { useRecargarAlVolver } from '../../../src/hooks/useRecargarAlVolver';

/**
 * Mis pedidos (RF-14), opción del Drawer del cliente: fecha, número, total y estado, del más
 * reciente al más antiguo. Los pedidos viven en Supabase, así que siguen aquí al cerrar y reabrir
 * la app (RNF-09). Tocar un pedido abre su detalle con las líneas.
 */
export default function MisPedidos() {
  const consulta = usePedidosCliente();
  const pedidos = consulta.data ?? [];
  useRecargarAlVolver(consulta.refetch);

  const controlRecarga = (
    <RefreshControl
      refreshing={consulta.isRefetching}
      onRefresh={() => {
        void consulta.refetch();
      }}
      colors={[COLORES.primario]}
    />
  );

  /** El vacío y el error también se recargan deslizando. */
  function recargable(vista: ReactNode) {
    return (
      <ScrollView contentContainerClassName="flex-grow" refreshControl={controlRecarga}>
        {vista}
      </ScrollView>
    );
  }

  function contenido() {
    if (consulta.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando pedidos…" />;
    }
    if (consulta.isError && consulta.data === undefined) {
      return recargable(
        <EstadoVista
          tipo="error"
          mensaje="No se pudieron cargar tus pedidos"
          detalle={consulta.sinConexion ? 'Revisa tu conexión e inténtalo de nuevo' : consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />,
      );
    }
    if (pedidos.length === 0) {
      return recargable(
        <EstadoVista
          tipo="vacio"
          mensaje="Aún no tienes pedidos"
          detalle="Tus compras del carrito y las cotizaciones que aceptes aparecerán aquí."
          accion={{
            texto: 'Ir al catálogo',
            onPress: () => router.navigate('/(cliente)/(drawer)/(tabs)/catalogo'),
          }}
        />,
      );
    }
    return (
      <FlatList
        data={pedidos}
        keyExtractor={(pedido) => pedido.id}
        renderItem={({ item }) => (
          <TarjetaPedido
            pedido={item}
            onPress={() => router.push({ pathname: '/(cliente)/flujos/pedido/[id]', params: { id: item.id } })}
          />
        )}
        contentContainerClassName="px-pantalla pb-seccion"
        refreshControl={controlRecarga}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
      <View className="px-pantalla pb-2 pt-2">
        <Text className="font-titulo text-3xl text-texto">Mis pedidos</Text>
        {consulta.mostrandoCache ? (
          <View className="mt-bloque">
            <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
          </View>
        ) : null}
      </View>
      {contenido()}
    </SafeAreaView>
  );
}
