import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import AvisoConexion from '../../../../src/components/AvisoConexion';
import BarraBusqueda from '../../../../src/components/BarraBusqueda';
import ChipFiltro from '../../../../src/components/ChipFiltro';
import EstadoVista from '../../../../src/components/EstadoVista';
import FilaChips from '../../../../src/components/FilaChips';
import MarcasRevision from '../../../../src/components/MarcasRevision';
import TarjetaProducto from '../../../../src/components/TarjetaProducto';
import { COLORES } from '../../../../src/config/colores';
import { FILTROS_CATEGORIA } from '../../../../src/config/filtrosCatalogo';
import { useEliminarProducto } from '../../../../src/hooks/useEliminarProducto';
import { useProductos } from '../../../../src/hooks/useProductos';
import {
  esProductoPersonal,
  motivosRevision,
  type Categoria,
  type ProductoPersonal,
} from '../../../../src/models/Producto';
import { filtrarProductos } from '../../../../src/utils/catalogo';
import { formatearPrecio } from '../../../../src/utils/formato';

const RUTA_FORMULARIO = '/(trabajador)/flujos/producto-form';

/**
 * Productos del trabajador y del administrador (RF-29 a RF-31, mockup trabajador-productos):
 * lista con inventario, código, precios y estado; búsqueda por nombre o código sin tildes ni
 * mayúsculas; filtro de categoría; botón + para crear; cada producto abre su edición y tiene
 * Eliminar. Los productos que el negocio debe revisar (código SIN-COD, sin precio de instalador,
 * precio menor que el costo) llevan una marca naranja y se pueden ver solos con "Por revisar".
 * La protección por rol la hace el _layout del Drawer del trabajador.
 */
export default function Productos() {
  const consulta = useProductos();
  const { confirmarEliminar, idEliminando } = useEliminarProducto();

  // Criterios de la lista (estado local de la pantalla).
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [soloPorRevisar, setSoloPorRevisar] = useState(false);

  // El personal recibe ProductoPersonal (con costo y los dos precios); el filtro lo asegura para TypeScript.
  const productos = useMemo(
    () => (consulta.data ?? []).filter(esProductoPersonal),
    [consulta.data],
  );
  const totalPorRevisar = useMemo(
    () => productos.filter((producto) => motivosRevision(producto).length > 0).length,
    [productos],
  );
  // Filtra la lista ya cargada, sin pedir nada al servidor (igual que el catálogo).
  const visibles = useMemo(() => {
    const filtrados = filtrarProductos(productos, { texto: busqueda, categoria, marca: null });
    return soloPorRevisar
      ? filtrados.filter((producto) => motivosRevision(producto).length > 0)
      : filtrados;
  }, [productos, busqueda, categoria, soloPorRevisar]);

  const hayCriterios = busqueda.trim() !== '' || categoria !== null || soloPorRevisar;

  function limpiarCriterios() {
    setBusqueda('');
    setCategoria(null);
    setSoloPorRevisar(false);
  }

  function abrirNuevo() {
    router.push(RUTA_FORMULARIO);
  }

  function abrirEdicion(id: string) {
    router.push({ pathname: RUTA_FORMULARIO, params: { id } });
  }

  /** Precios del personal bajo el precio de cliente final, y las marcas de revisión. */
  function detallePersonal(producto: ProductoPersonal) {
    return (
      <View>
        <Text className="font-cuerpo text-sm text-texto-suave">
          Instalador:{' '}
          {producto.precioInstalador === null ? 'sin precio' : formatearPrecio(producto.precioInstalador)}
          {' · '}Costo: {formatearPrecio(producto.costo)}
        </Text>
        <MarcasRevision motivos={motivosRevision(producto)} />
      </View>
    );
  }

  function contenido() {
    if (consulta.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando productos…" />;
    }

    if (consulta.isError && consulta.data === undefined) {
      return (
        <EstadoVista
          tipo="error"
          mensaje="No se pudieron cargar los productos"
          detalle={consulta.sinConexion ? 'Revisa tu conexión e inténtalo de nuevo' : consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />
      );
    }

    if (productos.length === 0) {
      return (
        <EstadoVista
          tipo="vacio"
          mensaje="Aún no hay productos registrados"
          accion={{ texto: 'Nuevo producto', onPress: abrirNuevo }}
        />
      );
    }

    if (visibles.length === 0) {
      return (
        <EstadoVista
          tipo="vacio"
          mensaje="No hay productos que coincidan"
          detalle="Prueba con otro nombre o código, u otra categoría."
          accion={{ texto: 'Limpiar filtros', onPress: limpiarCriterios }}
        />
      );
    }

    return (
      <FlatList
        data={visibles}
        keyExtractor={(producto) => producto.id}
        renderItem={({ item }) => (
          <TarjetaProducto
            nombre={item.nombre}
            codigo={item.codigo}
            marca={item.marcaNombre}
            categoria={item.categoriaNombre}
            precio={item.precioClienteFinal}
            inventario={item.inventario}
            imagenUrl={item.imagenUrl}
            onPress={() => abrirEdicion(item.id)}
            etiquetaAccesible={`${item.nombre}, editar`}
            contenidoExtra={detallePersonal(item)}
            accion={{
              texto: idEliminando === item.id ? 'Eliminando…' : 'Eliminar',
              icono: 'trash-2',
              variante: 'peligro',
              siempreVisible: true,
              onPress: () => confirmarEliminar(item),
            }}
          />
        )}
        // Espacio abajo para que el botón + no tape la última tarjeta.
        contentContainerClassName="px-pantalla pb-24"
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
    // SafeAreaView solo agrega el espacio que tapa el sistema: arriba ya está el encabezado del Drawer.
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="px-pantalla pt-4">
        <Text className="font-titulo text-3xl text-texto">Productos</Text>
        <View className="mt-bloque">
          <BarraBusqueda valor={busqueda} onChangeText={setBusqueda} placeholder="Buscar productos" />
        </View>
      </View>

      {/* Filtro de categoría (RF-07) y "Por revisar", en una fila que se desplaza de lado. */}
      <FilaChips etiquetaAccesible="Filtrar productos" className="pt-bloque">
        <ChipFiltro
          etiqueta={`Por revisar (${totalPorRevisar})`}
          activo={soloPorRevisar}
          onPress={() => setSoloPorRevisar((anterior) => !anterior)}
        />
        {FILTROS_CATEGORIA.map((opcion) => (
          <ChipFiltro
            key={opcion.etiqueta}
            etiqueta={opcion.etiqueta}
            activo={categoria === opcion.valor}
            onPress={() => setCategoria(opcion.valor)}
          />
        ))}
      </FilaChips>

      <View className="px-pantalla pt-bloque">
        {consulta.mostrandoCache ? (
          <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
        ) : null}
        {productos.length > 0 ? (
          <Text className="mb-2 font-cuerpo text-sm text-texto-suave">
            {visibles.length === 1 ? '1 producto' : `${visibles.length} productos`}
            {hayCriterios ? ` de ${productos.length}` : ''}
          </Text>
        ) : null}
      </View>

      {contenido()}

      {/* Botón flotante + del mockup para crear un producto. */}
      <Pressable
        onPress={abrirNuevo}
        accessibilityRole="button"
        accessibilityLabel="Nuevo producto"
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primario shadow-md active:opacity-80"
      >
        <Feather name="plus" size={28} color={COLORES.fondo} />
      </Pressable>
    </SafeAreaView>
  );
}
