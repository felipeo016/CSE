import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import EtiquetaDisponibilidad from './EtiquetaDisponibilidad';
import ImagenProducto from './ImagenProducto';
import { COLORES } from '../config/colores';
import type { TarjetaProductoProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';

/**
 * Tarjeta de producto (mockup de Catálogo, RF-05, RF-09): imagen, nombre, código, marca y
 * categoría, precio y disponibilidad. Al pulsarla se abre el detalle. El botón de acción es
 * opcional (por ejemplo "+ Agregar" del cliente) y se oculta si no hay unidades o precio.
 */
export default function TarjetaProducto({
  nombre,
  codigo,
  marca,
  categoria,
  precio,
  inventario,
  imagenUrl,
  onPress,
  etiquetaAccesible,
  contenidoExtra,
  accion,
}: TarjetaProductoProps) {
  const puedeAccionar =
    accion !== undefined && (accion.siempreVisible === true || (inventario > 0 && precio !== null));
  const esPeligro = accion?.variante === 'peligro';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiquetaAccesible ?? `${nombre}, ver detalle`}
      className="mb-bloque flex-row rounded-tarjeta border border-borde bg-fondo p-3 active:opacity-80"
    >
      <ImagenProducto imagenUrl={imagenUrl} tamano="miniatura" />

      <View className="ml-3 flex-1">
        <Text className="font-titulo-semi text-base text-texto" numberOfLines={2}>
          {nombre}
        </Text>
        <Text className="font-cuerpo text-sm text-texto-suave" numberOfLines={1}>
          {codigo ? `Cód. ${codigo}` : 'Sin código'}
        </Text>
        <Text className="font-cuerpo text-xs text-texto-suave" numberOfLines={1}>
          {marca} · {categoria}
        </Text>

        <Text className="mt-1 font-titulo text-xl text-primario">
          {precio === null ? 'Sin precio registrado' : formatearPrecio(precio)}
        </Text>

        {contenidoExtra}

        <View className="mt-2 flex-row items-center justify-between">
          <EtiquetaDisponibilidad inventario={inventario} />

          {puedeAccionar ? (
            <Pressable
              onPress={accion.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${accion.texto} ${nombre}`}
              hitSlop={6}
              className={`h-10 flex-row items-center rounded-boton px-4 active:opacity-80 ${
                esPeligro ? 'border border-error bg-fondo' : 'bg-primario'
              }`}
            >
              {accion.icono ? (
                <Feather
                  name={accion.icono}
                  size={18}
                  color={esPeligro ? COLORES.error : COLORES.fondo}
                  style={{ marginRight: 4 }}
                />
              ) : null}
              <Text className={`font-cuerpo-semi text-sm ${esPeligro ? 'text-error' : 'text-fondo'}`}>
                {accion.texto}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
