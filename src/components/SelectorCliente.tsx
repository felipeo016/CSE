import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import BarraBusqueda from './BarraBusqueda';
import EstadoVista from './EstadoVista';
import TarjetaCliente from './TarjetaCliente';
import { COLORES } from '../config/colores';
import { useClientes } from '../hooks/useClientes';
import { useRetraso } from '../hooks/useRetraso';
import { NOMBRE_TIPO_CLIENTE } from '../models/Cliente';
import type { ListaClientesSelectorProps, SelectorClienteProps } from '../types/props.types';

/** Espera tras la última letra antes de buscar en el servidor. */
const ESPERA_BUSQUEDA_MS = 400;

/**
 * Campo "Cliente" de Crear cotización (mockup: nombre con flecha hacia abajo). Al tocarlo abre una
 * ventana con la lista de clientes de useClientes (F5) y su búsqueda por nombre o teléfono.
 * Debajo del nombre muestra el tipo del cliente, porque define el precio de cada producto.
 */
export default function SelectorCliente({ cliente, onElegir, bloqueado = false, error }: SelectorClienteProps) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const busquedaEnviada = useRetraso(busqueda, ESPERA_BUSQUEDA_MS);

  return (
    <View className="mb-bloque">
      <Text className="mb-2 font-titulo text-xl text-texto">Cliente</Text>

      <Pressable
        onPress={() => setAbierto(true)}
        disabled={bloqueado}
        accessibilityRole="button"
        accessibilityLabel={cliente ? `Cliente: ${cliente.nombre}` : 'Elegir cliente'}
        accessibilityState={{ disabled: bloqueado }}
        className={`min-h-14 flex-row items-center rounded-campo border px-4 py-2 ${
          error ? 'border-error' : 'border-borde'
        } ${bloqueado ? 'bg-superficie' : 'bg-fondo active:opacity-80'}`}
      >
        <Feather name="user" size={20} color={COLORES.texto} style={{ marginRight: 12 }} />
        <View className="flex-1">
          <Text
            className={`font-cuerpo text-base ${cliente ? 'text-texto' : 'text-texto-suave'}`}
            numberOfLines={1}
          >
            {cliente ? cliente.nombre : 'Elige un cliente'}
          </Text>
          {cliente ? (
            <Text className="font-cuerpo text-sm text-texto-suave">
              {NOMBRE_TIPO_CLIENTE[cliente.tipo]} · ve el precio de {NOMBRE_TIPO_CLIENTE[cliente.tipo].toLowerCase()}
            </Text>
          ) : null}
        </View>
        <Feather name={bloqueado ? 'lock' : 'chevron-down'} size={20} color={COLORES.texto} />
      </Pressable>

      {bloqueado ? (
        <Text className="mt-1 font-cuerpo text-sm text-texto-suave">
          La solicitud es de este cliente, por eso no se puede cambiar.
        </Text>
      ) : null}
      {error ? <Text className="mt-1 font-cuerpo text-sm text-error">{error}</Text> : null}

      <Modal visible={abierto} animationType="slide" onRequestClose={() => setAbierto(false)}>
        <SafeAreaView className="flex-1 bg-fondo">
          <View className="flex-row items-center px-pantalla pt-4">
            <Pressable
              onPress={() => setAbierto(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={10}
              className="mr-3"
            >
              <Feather name="x" size={24} color={COLORES.texto} />
            </Pressable>
            <Text className="font-titulo text-2xl text-texto">Elegir cliente</Text>
          </View>
          <View className="px-pantalla py-bloque">
            <BarraBusqueda valor={busqueda} onChangeText={setBusqueda} placeholder="Buscar clientes" />
          </View>
          {/* La lista solo se monta (y se pide al servidor) mientras la ventana está abierta. */}
          {abierto ? (
            <ListaClientes
              busqueda={busquedaEnviada}
              onElegir={(elegido) => {
                onElegir(elegido);
                setAbierto(false);
              }}
            />
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

/** Lista de clientes dentro de la ventana, con sus estados de carga, error y vacío. */
function ListaClientes({ busqueda, onElegir }: ListaClientesSelectorProps) {
  const consulta = useClientes(busqueda);

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
    return (
      <EstadoVista
        tipo="vacio"
        mensaje={busqueda.trim() ? 'No hay clientes que coincidan' : 'Aún no hay clientes registrados'}
        detalle="Puedes registrarlo en la pestaña Clientes."
      />
    );
  }
  return (
    <FlatList
      data={clientes}
      keyExtractor={(cliente) => cliente.id}
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="px-pantalla pb-seccion"
      renderItem={({ item }) => (
        <TarjetaCliente
          cliente={item}
          onPress={() => onElegir({ id: item.id, nombre: item.nombre, tipo: item.tipo })}
        />
      )}
    />
  );
}
