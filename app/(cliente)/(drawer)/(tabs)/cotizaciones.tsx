import type { ReactNode } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import AvisoConexion from '../../../../src/components/AvisoConexion';
import Boton from '../../../../src/components/Boton';
import EstadoVista from '../../../../src/components/EstadoVista';
import TarjetaCotizacion from '../../../../src/components/TarjetaCotizacion';
import { COLORES } from '../../../../src/config/colores';
import { useCotizaciones } from '../../../../src/hooks/useCotizaciones';
import { useRecargarAlVolver } from '../../../../src/hooks/useRecargarAlVolver';

/**
 * Bandeja de cotizaciones del cliente (RF-20). Lista sus cotizaciones con fecha, número, total y
 * estado, de la más reciente a la más antigua. Las Nuevas (sin abrir) se ven como no leídas y las
 * solicitudes que aún no se cotizan como "Por cotizar".
 * Solo llegan las cotizaciones del cliente de la sesión: lo garantiza el servidor (RLS).
 * Se recarga al deslizar hacia abajo (también en el vacío y en el error) y al volver a la
 * pantalla (useRecargarAlVolver).
 */
export default function BandejaCotizaciones() {
  // Sin filtros: el cliente ve todas las suyas (useCotizaciones de F5, TanStack Query).
  const consulta = useCotizaciones();
  const cotizaciones = consulta.data ?? [];
  useRecargarAlVolver(consulta.refetch);

  function solicitar() {
    router.push('/(cliente)/flujos/solicitar-cotizacion');
  }

  // Deslizar hacia abajo para recargar: lo usan la lista, el vacío y el error.
  const controlRecarga = (
    <RefreshControl
      refreshing={consulta.isRefetching}
      onRefresh={() => {
        void consulta.refetch();
      }}
      colors={[COLORES.primario]}
    />
  );

  /** El vacío y el error van dentro de un ScrollView para poder recargarlos deslizando. */
  function recargable(vista: ReactNode) {
    return (
      <ScrollView contentContainerClassName="flex-grow" refreshControl={controlRecarga}>
        {vista}
      </ScrollView>
    );
  }

  function contenido() {
    if (consulta.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando cotizaciones…" />;
    }

    if (consulta.isError && consulta.data === undefined) {
      return recargable(
        <EstadoVista
          tipo="error"
          mensaje="No se pudieron cargar tus cotizaciones"
          detalle={consulta.sinConexion ? 'Revisa tu conexión e inténtalo de nuevo' : consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />,
      );
    }

    if (cotizaciones.length === 0) {
      return recargable(
        <EstadoVista
          tipo="vacio"
          mensaje="Aún no tienes cotizaciones"
          detalle="Puedes pedir una con el botón Solicitar cotización de arriba. Cuando el negocio te envíe una cotización, aparecerá aquí."
        />,
      );
    }

    return (
      <FlatList
        data={cotizaciones}
        keyExtractor={(cotizacion) => cotizacion.id}
        renderItem={({ item }) => (
          <TarjetaCotizacion
            cotizacion={item}
            onPress={() => router.push({ pathname: '/cotizacion/[id]', params: { id: item.id } })}
          />
        )}
        contentContainerClassName="px-pantalla pb-seccion"
        refreshControl={controlRecarga}
      />
    );
  }

  return (
    // SafeAreaView solo agrega el espacio que tapa el sistema: arriba ya está el encabezado del Drawer.
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="px-pantalla pt-4">
        <Text className="font-titulo text-3xl text-texto">Cotizaciones</Text>
        <View className="my-bloque">
          <Boton texto="Solicitar cotización" icono="file-plus" onPress={solicitar} />
        </View>

        {consulta.mostrandoCache ? (
          <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
        ) : null}
      </View>

      {contenido()}
    </SafeAreaView>
  );
}
