import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { ContadorCantidadProps } from '../types/props.types';
import { cantidadValida, mensajeInventario } from '../utils/validaciones';

/**
 * Contador contextual (RF-10, RF-16): botones − y + y la cantidad escrita a mano.
 * - El + sube de a 1 hasta el inventario; ahí se deshabilita y muestra "Solo hay N unidades disponibles".
 * - El − no baja del mínimo (1); para quitar una línea se usa Eliminar.
 * - Lo escrito a mano se revisa con cantidadValida: vacío, texto, decimales o más que el inventario
 *   se rechazan con mensaje y la cantidad anterior se conserva.
 * Solo llama a onCambiar con cantidades válidas.
 */
export default function ContadorCantidad({
  valor,
  maximo,
  minimo = 1,
  onCambiar,
  etiquetaAccesible = 'Cantidad',
}: ContadorCantidadProps) {
  // Lo que se ve en la caja de texto (puede ser algo inválido mientras se escribe).
  const [texto, setTexto] = useState(String(valor));
  // Mensaje del último texto rechazado; null si lo escrito es válido.
  const [error, setError] = useState<string | null>(null);

  // Si la cantidad cambia desde fuera (botones, otra pantalla), la caja muestra el valor nuevo.
  useEffect(() => {
    setTexto(String(valor));
  }, [valor]);

  // Sin unidades para elegir (por ejemplo, todo el inventario ya está en el carrito): el contador
  // queda bloqueado y no muestra mensajes; la pantalla explica el motivo.
  const sinUnidades = maximo < minimo;
  const enMinimo = sinUnidades || valor <= minimo;
  const enMaximo = sinUnidades || valor >= maximo;

  function cambiarCon(nueva: number) {
    setError(null);
    onCambiar(nueva);
  }

  function alEscribir(nuevoTexto: string) {
    setTexto(nuevoTexto);
    const mensaje = cantidadValida(nuevoTexto, maximo);
    if (mensaje) {
      setError(mensaje); // se rechaza: no se avisa al padre
      return;
    }
    cambiarCon(Number(nuevoTexto.trim()));
  }

  // Al salir de la caja, si quedó algo inválido, vuelve a mostrar la última cantidad válida.
  function alSalir() {
    setTexto(String(valor));
    setError(null); // la cantidad mostrada vuelve a ser válida: el mensaje ya no aplica
  }

  // El aviso del límite se muestra cuando no hay otro error (RF-10).
  const mensaje = sinUnidades ? null : (error ?? (enMaximo ? mensajeInventario(maximo) : null));

  return (
    <View>
      <View className="flex-row items-center self-start rounded-campo border border-borde bg-fondo">
        <Pressable
          onPress={() => cambiarCon(valor - 1)}
          disabled={enMinimo}
          accessibilityRole="button"
          accessibilityLabel="Restar uno"
          accessibilityState={{ disabled: enMinimo }}
          hitSlop={4}
          className={`h-11 w-11 items-center justify-center rounded-l-campo bg-superficie ${
            enMinimo ? 'opacity-40' : 'active:opacity-70'
          }`}
        >
          <Feather name="minus" size={20} color={COLORES.texto} />
        </Pressable>

        <TextInput
          value={texto}
          onChangeText={alEscribir}
          onBlur={alSalir}
          keyboardType="number-pad"
          editable={!sinUnidades}
          selectTextOnFocus
          maxLength={4}
          accessibilityLabel={etiquetaAccesible}
          className="h-11 w-14 p-0 text-center font-cuerpo-semi text-lg text-texto"
        />

        <Pressable
          onPress={() => cambiarCon(valor + 1)}
          disabled={enMaximo}
          accessibilityRole="button"
          accessibilityLabel="Sumar uno"
          accessibilityState={{ disabled: enMaximo }}
          hitSlop={4}
          className={`h-11 w-11 items-center justify-center rounded-r-campo bg-superficie ${
            enMaximo ? 'opacity-40' : 'active:opacity-70'
          }`}
        >
          <Feather name="plus" size={20} color={COLORES.texto} />
        </Pressable>
      </View>

      {mensaje ? (
        <Text className="mt-1 font-cuerpo text-sm text-error" accessibilityLiveRegion="polite">
          {mensaje}
        </Text>
      ) : null}
    </View>
  );
}
