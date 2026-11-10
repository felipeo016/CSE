import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import AvisoConexion from '../../../../src/components/AvisoConexion';
import BarraBusqueda from '../../../../src/components/BarraBusqueda';
import ChipFiltro from '../../../../src/components/ChipFiltro';
import EstadoVista from '../../../../src/components/EstadoVista';
import TarjetaProducto from '../../../../src/components/TarjetaProducto';
import { COLORES } from '../../../../src/config/colores';
import { FILTROS_CATEGORIA, FILTROS_MARCA } from '../../../../src/config/filtrosCatalogo';
import { useProductos } from '../../../../src/hooks/useProductos';
import type { Categoria, Marca, ProductoSegunRol } from '../../../../src/models/Producto';
import { useCarritoStore } from '../../../../src/store/carritoStore';
import { lineaDesdeProducto } from '../../../../src/utils/carrito';
import { filtrarProductos } from '../../../../src/utils/catalogo';

/** "12 productos", "1 producto encontrado", "3 productos encontrados"... */
function textoResultados(cantidad: number, filtrando: boolean): string {
  const base = cantidad === 1 ? '1 producto' : `${cantidad} productos`;
  if (!filtrando) {
    return base;
  }
  return cantidad === 1 ? `${base} encontrado` : `${base} encontrados`;
}

/**
 * Catálogo del cliente (RF-05 a RF-07, RF-10): lista virtualizada con búsqueda por nombre o
 * código y filtros de categoría y marca. Búsqueda y filtros se aplican sobre los datos ya
 * cargados por useProductos, sin una petición por cada tecla (RNF-03).
 * La protección por rol la hace el _layout del Drawer del cliente.
 */
export default function Catalogo() {
  const consulta = useProductos();
  const agregar = useCarritoStore((estado) => estado.agregar);

  // useState: lo que el usuario escribe y los filtros elegidos (null = "Todas").
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [marca, setMarca] = useState<Marca | null>(null);

  // useMemo: solo se vuelve a filtrar cuando cambian los datos, la búsqueda o un filtro.
  const productos = useMemo(
    () => filtrarProductos(consulta.data ?? [], { texto: busqueda, categoria, marca }),
    [consulta.data, busqueda, categoria, marca],
  );

  const hayCriterios = busqueda.trim() !== '' || categoria !== null || marca !== null;

  function limpiarBusqueda() {
    setBusqueda('');
    setCategoria(null);
    setMarca(null);
  }

  function abrirDetalle(id: string) {
    router.push({ pathname: '/producto/[id]', params: { id } });
  }

  // "+ Agregar" de la tarjeta suma 1 unidad. El indicador de la pestaña Carrito se actualiza solo.
  function agregarUno(producto: ProductoSegunRol) {
    const linea = lineaDesdeProducto(producto, 1);
    if (!linea) {
      return; // sin precio la tarjeta no muestra el botón
    }
    const resultado = agregar(linea);
    if (!resultado.ok) {
      Alert.alert('No se pudo agregar', resultado.mensaje);
    }
  }

  function contenido() {
    if (consulta.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando catálogo…" />;
    }

    if (consulta.isError && consulta.data === undefined) {
      return (
        <EstadoVista
          tipo="error"
          mensaje="No se pudo cargar el catálogo"
          detalle={consulta.sinConexion ? 'Revisa tu conexión e inténtalo de nuevo' : consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />
      );
    }

    if ((consulta.data ?? []).length === 0) {
      return <EstadoVista tipo="vacio" mensaje="Aún no hay productos en el catálogo" />;
    }

    if (productos.length === 0) {
      return (
        <EstadoVista
          tipo="vacio"
          mensaje="No encontramos productos"
          detalle="Prueba con otra búsqueda o categoría"
          accion={{ texto: 'Limpiar búsqueda', onPress: limpiarBusqueda }}
        />
      );
    }

    return (
      <FlatList
        data={productos}
        keyExtractor={(producto) => producto.id}
        renderItem={({ item }) => (
          <TarjetaProducto
            nombre={item.nombre}
            codigo={item.codigo}
            marca={item.marcaNombre}
            categoria={item.categoriaNombre}
            precio={item.precio}
            inventario={item.inventario}
            imagenUrl={item.imagenUrl}
            onPress={() => abrirDetalle(item.id)}
            accion={{ texto: 'Agregar', icono: 'plus', onPress: () => agregarUno(item) }}
          />
        )}
        // Lista virtualizada (RNF-03): solo se dibujan las tarjetas cercanas a la pantalla.
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
        contentContainerClassName="px-pantalla pb-seccion"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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

  const mostrarContador = consulta.data !== undefined && consulta.data.length > 0;

  return (
    // SafeAreaView solo agrega el espacio que tapa el sistema: arriba ya está el encabezado del Drawer.
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="px-pantalla pt-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-titulo text-3xl text-texto">Catálogo</Text>
          <Pressable
            onPress={() => router.navigate('/(cliente)/(drawer)/(tabs)/carrito')}
            accessibilityRole="button"
            accessibilityLabel="Ir al carrito"
            hitSlop={10}
          >
            <Feather name="shopping-cart" size={26} color={COLORES.texto} />
          </Pressable>
        </View>

        <View className="mt-bloque">
          <BarraBusqueda valor={busqueda} onChangeText={setBusqueda} placeholder="Buscar productos" />
        </View>
      </View>

      {/* Filtros en filas que se desplazan de lado, como los chips del mockup. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-pantalla pt-bloque"
        className="flex-grow-0"
        accessibilityLabel="Filtrar por categoría"
      >
        {FILTROS_CATEGORIA.map((opcion) => (
          <ChipFiltro
            key={opcion.etiqueta}
            etiqueta={opcion.etiqueta}
            activo={categoria === opcion.valor}
            onPress={() => setCategoria(opcion.valor)}
          />
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-pantalla pt-2"
        className="flex-grow-0"
        accessibilityLabel="Filtrar por marca"
      >
        {FILTROS_MARCA.map((opcion) => (
          <ChipFiltro
            key={opcion.etiqueta}
            etiqueta={opcion.etiqueta}
            activo={marca === opcion.valor}
            onPress={() => setMarca(opcion.valor)}
          />
        ))}
      </ScrollView>

      <View className="px-pantalla pt-bloque">
        {consulta.mostrandoCache ? (
          <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
        ) : null}

        {mostrarContador ? (
          // El número coincide con las tarjetas de la lista porque sale del mismo arreglo (RF-07).
          <Text className="mb-2 font-cuerpo text-sm text-texto-suave" accessibilityLiveRegion="polite">
            {textoResultados(productos.length, hayCriterios)}
          </Text>
        ) : null}
      </View>

      {contenido()}
    </SafeAreaView>
  );
}
