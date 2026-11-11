import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import AvisoConexion from '../../../src/components/AvisoConexion';
import BarraBusqueda from '../../../src/components/BarraBusqueda';
import EstadoVista from '../../../src/components/EstadoVista';
import TarjetaUbicacion from '../../../src/components/TarjetaUbicacion';
import { COLORES } from '../../../src/config/colores';
import { useTodasLasUbicaciones } from '../../../src/hooks/useUbicaciones';
import type { Ubicacion } from '../../../src/models/Ubicacion';
import { normalizarTexto } from '../../../src/utils/texto';

/**
 * Ubicaciones del trabajador y del administrador (RF-26): todas las ubicaciones de servicio, con
 * búsqueda por cliente y acceso a registrar una a nombre de un cliente. La búsqueda se aplica
 * sobre la lista ya cargada, sin una petición por cada letra (RNF-03).
 * La protección por rol la hace el _layout del Drawer del trabajador.
 */
export default function Ubicaciones() {
  const [busqueda, setBusqueda] = useState('');
  const consulta = useTodasLasUbicaciones();

  const texto = normalizarTexto(busqueda);
  const filtradas = useMemo(
    () =>
      (consulta.data ?? []).filter((u) =>
        texto === '' ? true : normalizarTexto(u.clienteNombre ?? '').includes(texto),
      ),
    [consulta.data, texto],
  );

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
    if (consulta.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando ubicaciones…" />;
    }
    if (consulta.isError && consulta.data === undefined) {
      return (
        <EstadoVista
          tipo="error"
          mensaje="No se pudieron cargar las ubicaciones"
          detalle={consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />
      );
    }
    if (filtradas.length === 0) {
      return texto !== '' ? (
        <EstadoVista
          tipo="vacio"
          mensaje="No hay ubicaciones que coincidan"
          detalle={`No encontramos ubicaciones de clientes con "${busqueda.trim()}" en el nombre.`}
          accion={{ texto: 'Limpiar búsqueda', onPress: () => setBusqueda('') }}
        />
      ) : (
        <EstadoVista
          tipo="vacio"
          mensaje="Aún no hay ubicaciones registradas"
          accion={{ texto: 'Registrar ubicación', onPress: registrar }}
        />
      );
    }
    return (
      <FlatList
        data={filtradas}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => (
          <TarjetaUbicacion ubicacion={item} mostrarCliente onPress={() => verEnMapa(item)} />
        )}
        contentContainerClassName="px-pantalla pb-seccion"
        keyboardShouldPersistTaps="handled"
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
      <View className="px-pantalla pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-titulo text-3xl text-texto">Ubicaciones</Text>
          <Pressable
            onPress={registrar}
            accessibilityRole="button"
            accessibilityLabel="Registrar ubicación"
            className="h-11 flex-row items-center rounded-boton bg-primario px-4 active:opacity-80"
          >
            <Feather name="plus" size={18} color={COLORES.fondo} style={{ marginRight: 6 }} />
            <Text className="font-cuerpo-semi text-base text-fondo">Nueva</Text>
          </Pressable>
        </View>

        <View className="my-bloque">
          <BarraBusqueda valor={busqueda} onChangeText={setBusqueda} placeholder="Buscar por cliente" />
        </View>

        {consulta.mostrandoCache ? (
          <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
        ) : null}
      </View>

      {contenido()}
    </SafeAreaView>
  );
}
