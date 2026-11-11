import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import AvisoConexion from '../../../src/components/AvisoConexion';
import EstadoVista from '../../../src/components/EstadoVista';
import TarjetaUbicacion from '../../../src/components/TarjetaUbicacion';
import { COLORES } from '../../../src/config/colores';
import { useUbicacionesCliente } from '../../../src/hooks/useUbicaciones';
import type { Ubicacion } from '../../../src/models/Ubicacion';
import { useSesionStore } from '../../../src/store/sesionStore';

/**
 * Mis ubicaciones (RF-26): las ubicaciones de servicio del cliente, con acceso a registrar una
 * nueva y a verlas en el mapa. Solo llegan las suyas: lo garantiza RLS (RNF-13).
 */
export default function MisUbicaciones() {
  const clienteId = useSesionStore((s) => s.usuario?.clienteId ?? null);
  const consulta = useUbicacionesCliente(clienteId);

  function registrar() {
    router.push('/(trabajador)/flujos/ubicacion-form');
  }

  function verEnMapa(ubicacion: Ubicacion) {
    router.push({
      pathname: '/(cliente)/flujos/mapa',
      params: {
        modo: 'negocio',
        latitud: String(ubicacion.coordenadas.latitud),
        longitud: String(ubicacion.coordenadas.longitud),
      },
    });
  }

  function contenido() {
    if (clienteId === null) {
      return (
        <EstadoVista
          tipo="error"
          mensaje="Tu cuenta no tiene una ficha de cliente"
          detalle="Comunícate con el negocio para que la revisen."
        />
      );
    }
    if (consulta.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando tus ubicaciones…" />;
    }
    if (consulta.isError && consulta.data === undefined) {
      return (
        <EstadoVista
          tipo="error"
          mensaje="No se pudieron cargar tus ubicaciones"
          detalle={consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />
      );
    }
    const ubicaciones = consulta.data ?? [];
    if (ubicaciones.length === 0) {
      return (
        <EstadoVista
          tipo="vacio"
          mensaje="Aún no tienes ubicaciones registradas"
          detalle="Registra el lugar de instalación o mantenimiento para poder agendar tu visita."
          accion={{ texto: 'Registrar ubicación', onPress: registrar }}
        />
      );
    }
    return (
      <FlatList
        data={ubicaciones}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => <TarjetaUbicacion ubicacion={item} onPress={() => verEnMapa(item)} />}
        contentContainerClassName="px-pantalla pb-seccion"
        refreshControl={
          <RefreshControl
            refreshing={consulta.isRefetching}
            onRefresh={() => {
              void consulta.refetch();
            }}
            colors={[COLORES.primario]}
          />
        }
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="px-pantalla pb-bloque pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-titulo text-3xl text-texto">Mis ubicaciones</Text>
          {clienteId !== null ? (
            <Pressable
              onPress={registrar}
              accessibilityRole="button"
              accessibilityLabel="Registrar ubicación"
              className="h-11 flex-row items-center rounded-boton bg-primario px-4 active:opacity-80"
            >
              <Feather name="plus" size={18} color={COLORES.fondo} style={{ marginRight: 6 }} />
              <Text className="font-cuerpo-semi text-base text-fondo">Nueva</Text>
            </Pressable>
          ) : null}
        </View>
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
