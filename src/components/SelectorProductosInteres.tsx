import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import BarraBusqueda from './BarraBusqueda';
import { COLORES } from '../config/colores';
import { useProductos } from '../hooks/useProductos';
import type { ProductoElegido, SelectorProductosInteresProps } from '../types/props.types';
import { normalizarTexto } from '../utils/texto';

/** Máximo de resultados que se muestran a la vez, para no llenar el formulario. */
const MAX_RESULTADOS = 6;

/**
 * Productos de interés de una solicitud (RF-15, opcionales). Busca en el catálogo con
 * useProductos (F4) por nombre o código y permite marcar o quitar productos.
 * Si el catálogo no carga, el resto del formulario sigue funcionando: los productos son opcionales.
 */
export default function SelectorProductosInteres({ elegidos, onCambiar }: SelectorProductosInteresProps) {
  const productos = useProductos();
  const [busqueda, setBusqueda] = useState('');

  // Productos que coinciden con la búsqueda (sin distinguir mayúsculas ni tildes).
  const resultados = useMemo(() => {
    const texto = normalizarTexto(busqueda);
    if (texto === '' || !productos.data) {
      return [];
    }
    return productos.data
      .filter(
        (producto) =>
          normalizarTexto(producto.nombre).includes(texto) ||
          normalizarTexto(producto.codigo ?? '').includes(texto),
      )
      .slice(0, MAX_RESULTADOS);
  }, [busqueda, productos.data]);

  const idsElegidos = new Set(elegidos.map((producto) => producto.id));

  function alternar(producto: ProductoElegido) {
    onCambiar(
      idsElegidos.has(producto.id)
        ? elegidos.filter((elegido) => elegido.id !== producto.id)
        : [...elegidos, producto],
    );
  }

  return (
    <View className="mb-bloque">
      <Text className="mb-2 font-cuerpo-semi text-base text-texto">Productos de interés (opcional)</Text>

      {/* Productos ya elegidos: se quitan con la x. */}
      {elegidos.length > 0 ? (
        <View className="mb-bloque flex-row flex-wrap gap-2">
          {elegidos.map((producto) => (
            <Pressable
              key={producto.id}
              onPress={() => alternar(producto)}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${producto.nombre}`}
              className="max-w-full flex-row items-center rounded-boton bg-primario/15 py-2 pl-3 pr-2"
            >
              <Text className="mr-1 shrink font-cuerpo-medio text-sm text-primario" numberOfLines={1}>
                {producto.nombre}
              </Text>
              <Feather name="x" size={16} color={COLORES.primario} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <BarraBusqueda
        valor={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar producto por nombre o código"
      />

      <View className="mt-2">
        {productos.isPending ? (
          <Text className="py-2 font-cuerpo text-sm text-texto-suave">Cargando catálogo…</Text>
        ) : productos.isError && productos.data === undefined ? (
          <View className="flex-row items-center py-2">
            <Text className="flex-1 font-cuerpo text-sm text-error">
              No se pudo cargar el catálogo. Puede enviar la solicitud sin productos.
            </Text>
            <Pressable onPress={() => productos.refetch()} accessibilityRole="button" hitSlop={8}>
              <Text className="ml-2 font-cuerpo-semi text-sm text-primario">Reintentar</Text>
            </Pressable>
          </View>
        ) : busqueda.trim() === '' ? (
          <Text className="py-2 font-cuerpo text-sm text-texto-suave">
            Escriba para buscar en el catálogo.
          </Text>
        ) : resultados.length === 0 ? (
          <Text className="py-2 font-cuerpo text-sm text-texto-suave">
            No hay productos que coincidan.
          </Text>
        ) : (
          resultados.map((producto) => {
            const elegido = idsElegidos.has(producto.id);
            return (
              <Pressable
                key={producto.id}
                onPress={() => alternar({ id: producto.id, nombre: producto.nombre })}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: elegido }}
                className="flex-row items-center border-b border-borde py-3 active:opacity-70"
              >
                <View className="mr-3 flex-1">
                  <Text className="font-cuerpo-medio text-base text-texto" numberOfLines={2}>
                    {producto.nombre}
                  </Text>
                  <Text className="font-cuerpo text-sm text-texto-suave">
                    {producto.codigo ?? 'Sin código'} · {producto.marcaNombre}
                  </Text>
                </View>
                <Feather
                  name={elegido ? 'check-square' : 'square'}
                  size={22}
                  color={elegido ? COLORES.primario : COLORES.textoSuave}
                />
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}
