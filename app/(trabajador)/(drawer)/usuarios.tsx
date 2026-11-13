import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import AvisoConexion from '../../../src/components/AvisoConexion';
import BarraBusqueda from '../../../src/components/BarraBusqueda';
import Boton from '../../../src/components/Boton';
import EstadoVista from '../../../src/components/EstadoVista';
import RutaProtegida from '../../../src/components/RutaProtegida';
import TarjetaUsuario from '../../../src/components/TarjetaUsuario';
import { COLORES } from '../../../src/config/colores';
import { useUsuarios } from '../../../src/hooks/useUsuarios';
import { ROLES_ADMINISTRADOR } from '../../../src/utils/navegacion';
import { normalizarTexto } from '../../../src/utils/texto';

/**
 * Usuarios y roles (RF-34): lista con nombre, correo, rol y estado, búsqueda y acceso a crear y
 * editar. Opción del Drawer solo del administrador; un cliente o trabajador que escriba la ruta
 * ve "Acceso no autorizado" (CP-12). Además, el servidor solo le entrega la lista completa al
 * administrador (RLS de perfiles) y la Edge Function rechaza a cualquier otro rol (RNF-05).
 */
export default function UsuariosYRoles() {
  return (
    <RutaProtegida roles={ROLES_ADMINISTRADOR}>
      <ListaUsuarios />
    </RutaProtegida>
  );
}

function ListaUsuarios() {
  const [busqueda, setBusqueda] = useState('');
  const consulta = useUsuarios();

  // La búsqueda se aplica sobre la lista ya cargada (son pocos usuarios): nombre, correo o rol.
  const texto = normalizarTexto(busqueda);
  const filtrados = useMemo(
    () =>
      (consulta.data ?? []).filter((usuario) =>
        texto === ''
          ? true
          : [usuario.nombre, usuario.correo, usuario.rolNombre].some((campo) =>
              normalizarTexto(campo).includes(texto),
            ),
      ),
    [consulta.data, texto],
  );

  function abrirNuevo() {
    router.push('/(trabajador)/flujos/usuario-form');
  }

  function abrirEdicion(id: string) {
    router.push({ pathname: '/(trabajador)/flujos/usuario-form', params: { id } });
  }

  function contenido() {
    if (consulta.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando usuarios…" />;
    }
    if (consulta.isError && consulta.data === undefined) {
      return (
        <EstadoVista
          tipo="error"
          mensaje="No se pudieron cargar los usuarios"
          detalle={consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />
      );
    }
    if (filtrados.length === 0) {
      return texto !== '' ? (
        <EstadoVista
          tipo="vacio"
          mensaje="No hay usuarios que coincidan"
          detalle={`No encontramos usuarios con "${busqueda.trim()}" en el nombre, el correo o el rol.`}
          accion={{ texto: 'Limpiar búsqueda', onPress: () => setBusqueda('') }}
        />
      ) : (
        <EstadoVista tipo="vacio" mensaje="Aún no hay usuarios" accion={{ texto: 'Crear usuario', onPress: abrirNuevo }} />
      );
    }
    return (
      <FlatList
        data={filtrados}
        keyExtractor={(usuario) => usuario.id}
        renderItem={({ item }) => <TarjetaUsuario usuario={item} onPress={() => abrirEdicion(item.id)} />}
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
    // Arriba ya está el encabezado del Drawer: solo se protegen los bordes de abajo y los lados.
    <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
      <View className="px-pantalla pt-4">
        <Text className="font-titulo text-3xl text-texto">Usuarios y roles</Text>
        <View className="my-bloque">
          <BarraBusqueda valor={busqueda} onChangeText={setBusqueda} placeholder="Buscar usuarios" />
        </View>
        {consulta.mostrandoCache ? (
          <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
        ) : null}
      </View>

      {contenido()}

      {/* Botón fijo abajo, como en el mockup. Crea usuarios de cualquier rol. */}
      <View className="border-t border-borde px-pantalla py-bloque">
        <Boton texto="Crear usuario" icono="user-plus" onPress={abrirNuevo} />
      </View>
    </SafeAreaView>
  );
}
