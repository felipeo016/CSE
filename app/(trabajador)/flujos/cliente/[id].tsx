import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import AvatarIniciales from '../../../../src/components/AvatarIniciales';
import AvisoConexion from '../../../../src/components/AvisoConexion';
import Boton from '../../../../src/components/Boton';
import EstadoVista from '../../../../src/components/EstadoVista';
import RutaProtegida from '../../../../src/components/RutaProtegida';
import { COLORES } from '../../../../src/config/colores';
import { useCliente } from '../../../../src/hooks/useClientes';

import type {
  ContenidoPorIdProps,
  FilaDatoProps,
  TarjetaDatosClienteProps,
} from '../../../../src/types/props.types';
import { formatearTelefono } from '../../../../src/utils/formato';
import { ROLES_PERSONAL } from '../../../../src/utils/navegacion';

/**
 * Detalle de cliente (RF-33), ruta dinámica por id. Muestra sus datos y el botón Editar.
 * Las ubicaciones y el historial de cotizaciones, pedidos y citas los completa F8.
 */
export default function DetalleClientePantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RutaProtegida roles={ROLES_PERSONAL}>
      {/* Título del mockup: "← Cliente". */}
      <Stack.Screen options={{ title: 'Cliente' }} />
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        <ContenidoDetalle id={id} />
      </SafeAreaView>
    </RutaProtegida>
  );
}

function ContenidoDetalle({ id }: ContenidoPorIdProps) {
  const consulta = useCliente(id);

  if (consulta.isPending) {
    return <EstadoVista tipo="carga" mensaje="Cargando cliente…" />;
  }
  if (consulta.isError && consulta.data === undefined) {
    return (
      <EstadoVista
        tipo="error"
        mensaje="No se pudo cargar el cliente"
        detalle={consulta.error.mensaje}
        accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
      />
    );
  }
  if (!consulta.data) {
    return (
      <EstadoVista
        tipo="vacio"
        mensaje="Cliente no encontrado"
        accion={{ texto: 'Volver a Clientes', onPress: () => router.back() }}
      />
    );
  }

  const cliente = consulta.data;

  return (
    <ScrollView
      contentContainerClassName="px-pantalla py-bloque"
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

      <TarjetaDatos cliente={cliente} />

      <View className="mt-bloque">
        <Boton
          texto="Editar"
          variante="secundario"
          icono="edit-2"
          onPress={() =>
            router.push({ pathname: '/(trabajador)/flujos/cliente-form', params: { id: cliente.id } })
          }
        />
      </View>

      {/* Ubicaciones e historial: los completa F8 (RF-33). */}
      <Text className="mb-2 mt-seccion font-titulo-semi text-xl text-texto">Historial</Text>
      <View className="rounded-tarjeta border border-borde bg-superficie p-4">
        <Text className="font-cuerpo text-base text-texto-suave">
          Ubicaciones, cotizaciones, pedidos y citas del cliente: En construcción — F8
        </Text>
      </View>
    </ScrollView>
  );
}

/** Tarjeta superior del mockup: iniciales, nombre y una fila por dato. */
function TarjetaDatos({ cliente }: TarjetaDatosClienteProps) {
  return (
    <View className="rounded-tarjeta border border-borde bg-fondo p-4">
      <View className="mb-bloque flex-row items-center">
        <AvatarIniciales iniciales={cliente.iniciales} tamano="grande" />
        <Text className="ml-4 flex-1 font-titulo text-2xl text-texto">{cliente.nombre}</Text>
      </View>

      <FilaDato
        icono="phone"
        etiqueta="Teléfono"
        valor={cliente.telefono ? formatearTelefono(cliente.telefono) : 'Sin registrar'}
      />
      <FilaDato icono="mail" etiqueta="Correo" valor={cliente.correo ?? 'Sin registrar'} />
      <FilaDato icono="tag" etiqueta="Tipo" valor={cliente.tipoNombre} />
      <FilaDato
        icono="smartphone"
        etiqueta="Cuenta en la app"
        valor={cliente.tieneCuenta ? 'Sí' : 'No'}
      />
    </View>
  );
}

function FilaDato({ icono, etiqueta, valor }: FilaDatoProps) {
  return (
    <View className="flex-row items-center py-2">
      <Feather name={icono} size={20} color={COLORES.textoSuave} style={{ marginRight: 12 }} />
      <Text className="w-36 font-cuerpo text-base text-texto-suave">{etiqueta}</Text>
      <Text className="flex-1 font-cuerpo text-base text-texto" selectable>
        {valor}
      </Text>
    </View>
  );
}
