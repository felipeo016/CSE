import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import ContadorCantidad from './ContadorCantidad';
import ImagenProducto from './ImagenProducto';
import { COLORES } from '../config/colores';
import { useCarritoStore } from '../store/carritoStore';
import type { LineaCarritoItemProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';

/**
 * Una línea del carrito (mockup de Carrito, RF-10): imagen, nombre, precio unitario, subtotal,
 * contador de cantidad limitado por el inventario y botón Eliminar.
 * Lee y cambia el carrito directamente en el store de Zustand.
 */
export default function LineaCarritoItem({ linea }: LineaCarritoItemProps) {
  const cambiarCantidad = useCarritoStore((estado) => estado.cambiarCantidad);
  const eliminar = useCarritoStore((estado) => estado.eliminar);

  return (
    <View className="mb-bloque flex-row rounded-tarjeta border border-borde bg-fondo p-3">
      <ImagenProducto imagenUrl={linea.imagenUrl} tamano="miniatura" />

      <View className="ml-3 flex-1">
        <Text className="font-titulo-semi text-base text-texto" numberOfLines={2}>
          {linea.nombre}
        </Text>
        <Text className="font-cuerpo-semi text-base text-primario">{formatearPrecio(linea.precio)}</Text>

        <View className="mt-2 flex-row items-start justify-between">
          {/* El contador solo entrega cantidades válidas; el store las vuelve a revisar. */}
          <ContadorCantidad
            valor={linea.cantidad}
            maximo={linea.inventario}
            onCambiar={(cantidad) => cambiarCantidad(linea.productoId, cantidad)}
            etiquetaAccesible={`Cantidad de ${linea.nombre}`}
          />
          <Pressable
            onPress={() => eliminar(linea.productoId)}
            accessibilityRole="button"
            accessibilityLabel={`Eliminar ${linea.nombre} del carrito`}
            hitSlop={8}
            className="ml-2 h-11 flex-row items-center active:opacity-70"
          >
            <Feather name="trash-2" size={18} color={COLORES.error} style={{ marginRight: 4 }} />
            <Text className="font-cuerpo-medio text-sm text-error">Eliminar</Text>
          </Pressable>
        </View>

        <Text className="mt-1 font-cuerpo text-sm text-texto-suave">
          Subtotal: {formatearPrecio(linea.precio * linea.cantidad)}
        </Text>
      </View>
    </View>
  );
}
