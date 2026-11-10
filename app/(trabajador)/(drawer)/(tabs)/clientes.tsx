import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import AvisoConexion from '../../../../src/components/AvisoConexion';
import BarraBusqueda from '../../../../src/components/BarraBusqueda';
import EstadoVista from '../../../../src/components/EstadoVista';
import TarjetaCliente from '../../../../src/components/TarjetaCliente';
import { COLORES } from '../../../../src/config/colores';
import { useClientes } from '../../../../src/hooks/useClientes';
import { useRetraso } from '../../../../src/hooks/useRetraso';

/** Espera tras la última letra antes de buscar en el servidor. */
const ESPERA_BUSQUEDA_MS = 400;

/**
 * Clientes del trabajador y del administrador (RF-33): lista con búsqueda por nombre o teléfono
 * y acceso a crear un cliente. La protección por rol la hace el _layout del Drawer del trabajador.
 */
export default function Clientes() {
  // Lo que el usuario escribe (se muestra al instante) y lo que se busca (tras una pausa).
  const [busqueda, setBusqueda] = useState('');
  const busquedaEnviada = useRetraso(busqueda, ESPERA_BUSQUEDA_MS);
  const consulta = useClientes(busquedaEnviada);

  const hayBusqueda = busquedaEnviada.trim() !== '';

  function abrirNuevo() {
    router.push('/(trabajador)/flujos/cliente-form');
  }

  function abrirDetalle(id: string) {
    router.push({ pathname: '/(trabajador)/flujos/cliente/[id]', params: { id } });
  }

  function contenido() {
    if (consulta.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando clientes…" />;
    }

    if (consulta.isError && consulta.data === undefined) {
      return (
        <EstadoVista
          tipo="error"
          mensaje="No se pudieron cargar los clientes"
          detalle={consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />
      );
    }

    const clientes = consulta.data ?? [];

    if (clientes.length === 0) {
      return hayBusqueda ? (
        <EstadoVista
          tipo="vacio"
          mensaje="No hay clientes que coincidan"
          detalle={`No encontramos clientes con "${busquedaEnviada.trim()}" en el nombre o el teléfono.`}
          accion={{ texto: 'Limpiar búsqueda', onPress: () => setBusqueda('') }}
        />
      ) : (
        <EstadoVista
          tipo="vacio"
          mensaje="Aún no hay clientes registrados"
          accion={{ texto: 'Nuevo cliente', onPress: abrirNuevo }}
        />
      );
    }

    return (
      <FlatList
        data={clientes}
        keyExtractor={(cliente) => cliente.id}
        renderItem={({ item }) => (
          <TarjetaCliente cliente={item} onPress={() => abrirDetalle(item.id)} />
        )}
        contentContainerClassName="px-pantalla pb-seccion"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={consulta.isRefetching && !consulta.isPlaceholderData}
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
    // SafeAreaView solo agrega el espacio que tapa el sistema: arriba ya está el encabezado del Drawer.
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="px-pantalla pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-titulo text-3xl text-texto">Clientes</Text>
          <Pressable
            onPress={abrirNuevo}
            accessibilityRole="button"
            accessibilityLabel="Nuevo cliente"
            className="h-11 flex-row items-center rounded-boton bg-primario px-4 active:opacity-80"
          >
            <Feather name="user-plus" size={18} color={COLORES.fondo} style={{ marginRight: 6 }} />
            <Text className="font-cuerpo-semi text-base text-fondo">Nuevo</Text>
          </Pressable>
        </View>

        <View className="my-bloque">
          <BarraBusqueda valor={busqueda} onChangeText={setBusqueda} placeholder="Buscar clientes" />
        </View>

        {consulta.mostrandoCache ? (
          <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
        ) : null}
      </View>

      {contenido()}
    </SafeAreaView>
  );
}
