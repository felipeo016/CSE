import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import ContadorCantidad from './ContadorCantidad';
import ImagenProducto from './ImagenProducto';
import { COLORES } from '../config/colores';
import type { LineaCotizacionItemProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';

/**
 * Una línea de Crear cotización (mockup): imagen, nombre, precio para el tipo del cliente,
 * contador de 1 al inventario disponible (ContadorCantidad de J3) y botón para quitarla.
 * Si la línea no se puede guardar (sin precio, agotada, más de lo disponible) muestra el motivo.
 */
export default function LineaCotizacionItem({ linea, onCambiarCantidad, onQuitar }: LineaCotizacionItemProps) {
  return (
    <View
      className={`mb-bloque flex-row rounded-tarjeta border bg-fondo p-3 ${
        linea.error ? 'border-error' : 'border-borde'
      }`}
    >
      <ImagenProducto imagenUrl={linea.imagenUrl} tamano="miniatura" />

      <View className="ml-3 flex-1">
        <Text className="font-titulo-semi text-base text-texto" numberOfLines={2}>
          {linea.nombre}
        </Text>
        <Text className="font-cuerpo-semi text-base text-primario">
          {linea.precio === null ? 'Sin precio' : formatearPrecio(linea.precio)}
        </Text>

        <View className="mt-2 flex-row items-start justify-between">
          {linea.inventario > 0 ? (
            <ContadorCantidad
              valor={linea.cantidad}
              maximo={linea.inventario}
              onCambiar={onCambiarCantidad}
              etiquetaAccesible={`Cantidad de ${linea.nombre}`}
            />
          ) : (
            <View />
          )}
          <Pressable
            onPress={onQuitar}
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${linea.nombre} de la cotización`}
            hitSlop={8}
            className="ml-2 h-11 w-11 items-center justify-center active:opacity-70"
          >
            <Feather name="trash-2" size={22} color={COLORES.error} />
          </Pressable>
        </View>

        {linea.precio !== null ? (
          <Text className="mt-1 font-cuerpo text-sm text-texto-suave">
            Subtotal: {formatearPrecio(linea.precio * linea.cantidad)}
          </Text>
        ) : null}
        {linea.error ? <Text className="mt-1 font-cuerpo text-sm text-error">{linea.error}</Text> : null}
      </View>
    </View>
  );
}
