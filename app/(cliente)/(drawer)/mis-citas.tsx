import { useMemo, type ReactNode } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import AvisoConexion from '../../../src/components/AvisoConexion';
import Boton from '../../../src/components/Boton';
import EstadoVista from '../../../src/components/EstadoVista';
import TarjetaCita from '../../../src/components/TarjetaCita';
import { COLORES } from '../../../src/config/colores';
import { useCitasCliente } from '../../../src/hooks/useCitas';
import { useRecargarAlVolver } from '../../../src/hooks/useRecargarAlVolver';
import { ordenarCitas } from '../../../src/utils/citas';

/**
 * Mis citas (RF-28), opción del Drawer del cliente: fecha, franja, tipo, ubicación y estado de cada
 * cita, con las Programadas primero. El cliente no cambia el estado: lo hace el trabajador, y el
 * cambio se ve al recargar (deslizar hacia abajo o volver a la pantalla). Las citas viven en
 * Supabase, así que siguen aquí al cerrar y reabrir la app (RNF-09).
 */
export default function MisCitas() {
  const consulta = useCitasCliente();
  const citas = useMemo(() => ordenarCitas(consulta.data ?? []), [consulta.data]);
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
      return <EstadoVista tipo="carga" mensaje="Cargando citas…" />;
    }
    if (consulta.isError && consulta.data === undefined) {
      return recargable(
        <EstadoVista
          tipo="error"
          mensaje="No se pudieron cargar tus citas"
          detalle={consulta.sinConexion ? 'Revisa tu conexión e inténtalo de nuevo' : consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />,
      );
    }
    if (citas.length === 0) {
      return recargable(
        <EstadoVista
          tipo="vacio"
          mensaje="Aún no tienes citas"
          detalle="Agenda una cita de instalación o mantenimiento con el botón de arriba."
        />,
      );
    }
    return (
      <FlatList
        data={citas}
        keyExtractor={(cita) => cita.id}
        renderItem={({ item }) => <TarjetaCita cita={item} />}
        contentContainerClassName="px-pantalla pb-seccion"
        refreshControl={controlRecarga}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
      <View className="px-pantalla pt-2">
        <Text className="font-titulo text-3xl text-texto">Mis citas</Text>
        <View className="my-bloque">
          <Boton
            texto="Agendar cita"
            icono="calendar"
            onPress={() => router.push('/(cliente)/flujos/agendar-cita')}
          />
        </View>
        {consulta.mostrandoCache ? (
          <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
        ) : null}
      </View>
      {contenido()}
    </SafeAreaView>
  );
}
