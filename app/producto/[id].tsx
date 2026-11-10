import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import AvisoConexion from '../../src/components/AvisoConexion';
import Boton from '../../src/components/Boton';
import ContadorCantidad from '../../src/components/ContadorCantidad';
import EstadoVista from '../../src/components/EstadoVista';
import EtiquetaDisponibilidad from '../../src/components/EtiquetaDisponibilidad';
import ImagenProducto from '../../src/components/ImagenProducto';
import RutaProtegida from '../../src/components/RutaProtegida';
import { COLORES } from '../../src/config/colores';
import { useProducto } from '../../src/hooks/useProductos';
import { esProductoPersonal } from '../../src/models/Producto';
import { useCarritoStore } from '../../src/store/carritoStore';
import { useSesionStore } from '../../src/store/sesionStore';
import type {
  CompraClienteProps,
  ContenidoPorIdProps,
  FilaResumenProps,
  PreciosPersonalProps,
} from '../../src/types/props.types';
import { lineaDesdeProducto } from '../../src/utils/carrito';
import { mensajeInventario } from '../../src/utils/validaciones';
import { formatearPrecio } from '../../src/utils/formato';
import { ROLES_TODOS, rutaInicioPorRol } from '../../src/utils/navegacion';

const RUTA_CARRITO = '/(cliente)/(drawer)/(tabs)/carrito';

/**
 * Detalle de producto, ruta dinámica /producto/[id] (RF-08). Lo abren todos los roles:
 * el cliente elige la cantidad con ContadorCantidad y lo agrega al carrito (RF-10, RF-11);
 * el personal ve los dos precios y el costo, sin el botón de agregar.
 */
export default function DetalleProducto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const esCliente = useSesionStore((estado) => estado.usuario?.rol === 'cliente');

  return (
    <RutaProtegida roles={ROLES_TODOS}>
      <Stack.Screen
        options={{
          // Título del mockup: "← Detalle", con el carrito a la derecha (solo el cliente tiene carrito).
          title: 'Detalle',
          headerRight: esCliente
            ? () => (
                <Pressable
                  onPress={() => router.navigate(RUTA_CARRITO)}
                  accessibilityRole="button"
                  accessibilityLabel="Ir al carrito"
                  hitSlop={10}
                >
                  <Feather name="shopping-cart" size={24} color={COLORES.texto} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        <ContenidoDetalle id={id} />
      </SafeAreaView>
    </RutaProtegida>
  );
}

function ContenidoDetalle({ id }: ContenidoPorIdProps) {
  const consulta = useProducto(id);
  const rol = useSesionStore((estado) => estado.usuario?.rol);

  // "Volver al catálogo": el del cliente o la lista de Productos del personal.
  function volverAlCatalogo() {
    if (rol === 'cliente') {
      router.navigate('/(cliente)/(drawer)/(tabs)/catalogo');
    } else if (rol) {
      router.navigate(rutaInicioPorRol(rol));
    }
  }

  const noEncontrado = (
    <EstadoVista
      tipo="vacio"
      mensaje="Producto no encontrado"
      detalle="Puede que el enlace esté mal o que el producto ya no esté en el catálogo."
      accion={{ texto: 'Volver al catálogo', onPress: volverAlCatalogo }}
    />
  );

  // Sin id en la ruta la consulta no se ejecuta: es lo mismo que un producto inexistente.
  if (!id) {
    return noEncontrado;
  }
  if (consulta.isPending) {
    return <EstadoVista tipo="carga" mensaje="Cargando producto…" />;
  }
  if (consulta.isError && consulta.data === undefined) {
    return (
      <EstadoVista
        tipo="error"
        mensaje="No se pudo cargar el producto"
        detalle={consulta.sinConexion ? 'Revisa tu conexión e inténtalo de nuevo' : consulta.error.mensaje}
        accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
      />
    );
  }
  if (!consulta.data) {
    return noEncontrado;
  }

  const producto = consulta.data;

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerClassName="px-pantalla pb-seccion pt-2"
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
      >
        {consulta.mostrandoCache ? (
          <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
        ) : null}

        <ImagenProducto imagenUrl={producto.imagenUrl} tamano="grande" />

        <Text className="mt-5 font-titulo text-2xl text-texto">{producto.nombre}</Text>
        <Text className="font-cuerpo text-base text-texto-suave">
          {producto.codigo ? `Cód. ${producto.codigo}` : 'Sin código'}
        </Text>
        <Text className="font-cuerpo text-sm text-texto-suave">
          {producto.marcaNombre} · {producto.categoriaNombre}
        </Text>

        {esProductoPersonal(producto) ? (
          <PreciosPersonal producto={producto} />
        ) : (
          <Text className="mt-2 font-titulo text-3xl text-primario">
            {producto.precio === null ? 'Sin precio registrado' : formatearPrecio(producto.precio)}
          </Text>
        )}

        <View className="mt-2">
          <EtiquetaDisponibilidad inventario={producto.inventario} />
        </View>

        <Text className="mt-seccion font-titulo-semi text-lg text-texto">Descripción</Text>
        <Text className="mt-1 font-cuerpo text-base leading-6 text-texto-suave">
          {producto.descripcion || 'Este producto no tiene descripción.'}
        </Text>

        {/* Solo el cliente compra: el personal ve el detalle sin agregar al carrito. */}
        {rol === 'cliente' ? <CompraCliente producto={producto} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Precios que ve el personal: cliente final, instalador y costo (decisión del equipo). */
function PreciosPersonal({ producto }: PreciosPersonalProps) {
  return (
    <View className="mt-3 rounded-tarjeta border border-borde p-4">
      <FilaPrecio etiqueta="Precio cliente final" valor={formatearPrecio(producto.precioClienteFinal)} />
      <FilaPrecio
        etiqueta="Precio instalador"
        valor={producto.precioInstalador === null ? 'Sin registrar' : formatearPrecio(producto.precioInstalador)}
      />
      <FilaPrecio etiqueta="Costo" valor={formatearPrecio(producto.costo)} />
    </View>
  );
}

function FilaPrecio({ etiqueta, valor }: FilaResumenProps) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="font-cuerpo text-base text-texto-suave">{etiqueta}</Text>
      <Text className="font-cuerpo-semi text-base text-texto">{valor}</Text>
    </View>
  );
}

/** Cantidad, Agregar al carrito y Solicitar cotización (mockup del detalle). */
function CompraCliente({ producto }: CompraClienteProps) {
  const agregar = useCarritoStore((estado) => estado.agregar);
  // Selector de Zustand: unidades de este producto que ya están en el carrito. Cambia apenas se
  // agrega, y con él el máximo del contador.
  const enCarrito = useCarritoStore(
    (estado) => estado.lineas.find((linea) => linea.productoId === producto.id)?.cantidad ?? 0,
  );
  // Cantidad elegida en el contador; empieza en 1.
  const [cantidad, setCantidad] = useState(1);

  const agotado = producto.inventario <= 0;
  const sinPrecio = producto.precio === null;
  // Lo que todavía se puede agregar: el inventario menos lo que ya está en el carrito
  // (agregar() suma a la cantidad que ya hay, así nunca se pasa del inventario).
  const maximo = Math.max(producto.inventario - enCarrito, 0);
  const todoEnCarrito = !agotado && maximo === 0;

  // Si el máximo baja (por ejemplo, después de agregar), el contador no puede quedar por encima.
  useEffect(() => {
    if (maximo >= 1 && cantidad > maximo) {
      setCantidad(maximo);
    }
  }, [maximo, cantidad]);

  function agregarAlCarrito() {
    const linea = lineaDesdeProducto(producto, cantidad);
    if (!linea) {
      return;
    }
    const resultado = agregar(linea);
    if (!resultado.ok) {
      Alert.alert('No se pudo agregar', resultado.mensaje);
      return;
    }
    setCantidad(1);
    Alert.alert('Agregado al carrito', `${cantidad} × ${producto.nombre}`, [
      { text: 'Seguir comprando', style: 'cancel' },
      { text: 'Ver carrito', onPress: () => router.navigate(RUTA_CARRITO) },
    ]);
  }

  return (
    <View className="mt-seccion">
      {agotado || todoEnCarrito ? null : (
        <View className="mb-bloque flex-row items-start justify-between rounded-tarjeta border border-borde p-4">
          <Text className="mt-2 font-titulo-semi text-lg text-texto">Cantidad</Text>
          <ContadorCantidad
            valor={cantidad}
            maximo={maximo}
            onCambiar={setCantidad}
            etiquetaAccesible={`Cantidad de ${producto.nombre}`}
          />
        </View>
      )}

      {todoEnCarrito ? (
        // Todo el inventario ya está en el carrito: no se puede agregar más (RF-10).
        <Text className="mb-2 font-cuerpo-semi text-sm text-error" accessibilityLiveRegion="polite">
          {mensajeInventario(producto.inventario)}
        </Text>
      ) : null}
      {enCarrito > 0 ? (
        <Text className="mb-2 font-cuerpo text-sm text-texto-suave">
          Ya tienes {enCarrito} {enCarrito === 1 ? 'unidad' : 'unidades'} en el carrito.
        </Text>
      ) : null}
      {sinPrecio ? (
        <Text className="mb-2 font-cuerpo text-sm text-error">
          Este producto no tiene precio registrado. Puedes solicitar una cotización.
        </Text>
      ) : null}

      <Boton
        texto={agotado ? 'Agotado' : 'Agregar al carrito'}
        icono={agotado ? undefined : 'shopping-cart'}
        onPress={agregarAlCarrito}
        deshabilitado={agotado || sinPrecio || todoEnCarrito}
      />
      <View className="mt-bloque">
        <Boton
          texto="Solicitar cotización"
          variante="secundario"
          onPress={() => router.push('/(cliente)/flujos/solicitar-cotizacion')}
        />
      </View>
    </View>
  );
}
