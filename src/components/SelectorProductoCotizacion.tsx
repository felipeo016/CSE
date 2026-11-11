import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import BarraBusqueda from './BarraBusqueda';
import EstadoVista from './EstadoVista';
import { COLORES } from '../config/colores';
import { useProductos } from '../hooks/useProductos';
import { NOMBRE_TIPO_CLIENTE } from '../models/Cliente';
import type { SelectorProductoCotizacionProps } from '../types/props.types';
import { motivoNoAgregable } from '../utils/cotizacionForm';
import { formatearPrecio } from '../utils/formato';
import { precioParaCliente } from '../utils/precios';
import { normalizarTexto } from '../utils/texto';

/**
 * Ventana "Agregar producto" de Crear cotización (RF-16). Busca en el inventario con useProductos
 * (F4) por nombre, código o marca, sin distinguir mayúsculas ni tildes.
 * Cada producto muestra el precio para el tipo del cliente (precioParaCliente). Si no se puede
 * agregar (agotado, sin precio para ese tipo o ya agregado) aparece deshabilitado con el motivo.
 */
export default function SelectorProductoCotizacion({
  visible,
  tipoCliente,
  idsEnCotizacion,
  onElegir,
  onCerrar,
}: SelectorProductoCotizacionProps) {
  const productos = useProductos();
  const [busqueda, setBusqueda] = useState('');

  const resultados = useMemo(() => {
    const texto = normalizarTexto(busqueda);
    const lista = productos.data ?? [];
    if (texto === '') {
      return lista;
    }
    return lista.filter(
      (producto) =>
        normalizarTexto(producto.nombre).includes(texto) ||
        normalizarTexto(producto.codigo ?? '').includes(texto) ||
        normalizarTexto(producto.marcaNombre).includes(texto),
    );
  }, [busqueda, productos.data]);

  function contenido() {
    if (productos.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando inventario…" />;
    }
    if (productos.isError && productos.data === undefined) {
      return (
        <EstadoVista
          tipo="error"
          mensaje="No se pudo cargar el inventario"
          detalle={productos.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => productos.refetch() }}
        />
      );
    }
    if (resultados.length === 0) {
      return (
        <EstadoVista
          tipo="vacio"
          mensaje={busqueda.trim() ? 'No hay productos que coincidan' : 'No hay productos en el inventario'}
        />
      );
    }

    return (
      <FlatList
        data={resultados}
        keyExtractor={(producto) => producto.id}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-pantalla pb-seccion"
        renderItem={({ item }) => {
          const yaEsta = idsEnCotizacion.includes(item.id);
          const motivo = yaEsta ? 'Ya está en la cotización' : motivoNoAgregable(item, tipoCliente);
          const precio = precioParaCliente(item, tipoCliente);
          return (
            <Pressable
              onPress={() => {
                onElegir(item);
                setBusqueda('');
              }}
              disabled={motivo !== null}
              accessibilityRole="button"
              accessibilityLabel={motivo ? `${item.nombre}. ${motivo}` : `Agregar ${item.nombre}`}
              accessibilityState={{ disabled: motivo !== null }}
              className={`flex-row items-center border-b border-borde py-3 ${
                motivo ? '' : 'active:opacity-70'
              }`}
            >
              <View className={`mr-3 flex-1 ${motivo ? 'opacity-60' : ''}`}>
                <Text className="font-cuerpo-medio text-base text-texto" numberOfLines={2}>
                  {item.nombre}
                </Text>
                <Text className="font-cuerpo text-sm text-texto-suave">
                  {item.codigo ?? 'Sin código'} · {item.marcaNombre} · Disponibles: {item.inventario}
                </Text>
                <Text className="font-cuerpo-semi text-base text-primario">
                  {precio === null ? 'Sin precio' : formatearPrecio(precio)}
                </Text>
                {motivo ? <Text className="font-cuerpo text-sm text-error">{motivo}</Text> : null}
              </View>
              <Feather
                name={motivo ? 'slash' : 'plus-circle'}
                size={22}
                color={motivo ? COLORES.textoSuave : COLORES.primario}
              />
            </Pressable>
          );
        }}
      />
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaView className="flex-1 bg-fondo">
        <View className="flex-row items-center px-pantalla pt-4">
          <Pressable onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={10} className="mr-3">
            <Feather name="x" size={24} color={COLORES.texto} />
          </Pressable>
          <Text className="font-titulo text-2xl text-texto">Agregar producto</Text>
        </View>
        <Text className="px-pantalla pt-1 font-cuerpo text-sm text-texto-suave">
          Precios de {NOMBRE_TIPO_CLIENTE[tipoCliente].toLowerCase()}, según el cliente elegido.
        </Text>
        <View className="px-pantalla py-bloque">
          <BarraBusqueda
            valor={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre, código o marca"
          />
        </View>
        {contenido()}
      </SafeAreaView>
    </Modal>
  );
}
