import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import { useCerrarSesion } from '../hooks/useCerrarSesion';
import { NOMBRE_ROL } from '../models/Usuario';
import { useSesionStore } from '../store/sesionStore';
import type { MenuLateralProps } from '../types/props.types';

/** Iniciales del nombre para el avatar: "Laura Gómez" → "LG" (como en Usuarios y roles del mockup). */
function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  const letras = palabras.slice(0, 2).map((palabra) => palabra.charAt(0).toUpperCase());
  return letras.join('') || '?';
}

/**
 * Contenido del Drawer (RF-03): nombre, correo y rol del usuario (sesionStore), las opciones
 * de su rol y Cerrar sesión con confirmación. Lo usan los _layout de (cliente) y (trabajador).
 */
export default function MenuLateral({ opciones, pantallaActual, onElegir }: MenuLateralProps) {
  const usuario = useSesionStore((estado) => estado.usuario);
  const { confirmarCierre, cerrando } = useCerrarSesion();

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      {/* Datos del usuario con sesión. */}
      <View className="flex-row items-center border-b border-borde px-pantalla pb-seccion pt-4">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-superficie">
          <Text className="font-titulo-semi text-xl text-primario">
            {iniciales(usuario?.nombre ?? '')}
          </Text>
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-titulo-semi text-lg text-texto" numberOfLines={1}>
            {usuario?.nombre ?? ''}
          </Text>
          <Text className="font-cuerpo text-sm text-texto-suave" numberOfLines={1}>
            {usuario?.correo ?? ''}
          </Text>
          {usuario ? (
            <Text className="font-cuerpo-medio text-xs text-primario">{NOMBRE_ROL[usuario.rol]}</Text>
          ) : null}
        </View>
      </View>

      {/* Opciones del rol. La abierta se resalta en azul. */}
      <ScrollView contentContainerClassName="px-3 py-bloque">
        {opciones.map((opcion) => {
          const activa = opcion.pantalla === pantallaActual;
          return (
            <Pressable
              key={opcion.pantalla}
              onPress={() => onElegir(opcion.pantalla)}
              accessibilityRole="button"
              accessibilityState={{ selected: activa }}
              className={`mb-1 h-12 flex-row items-center rounded-campo px-4 active:bg-superficie ${
                activa ? 'bg-superficie' : ''
              }`}
            >
              <Feather
                name={opcion.icono}
                size={22}
                color={activa ? COLORES.primario : COLORES.texto}
              />
              <Text
                className={`ml-4 font-cuerpo-semi text-base ${activa ? 'text-primario' : 'text-texto'}`}
              >
                {opcion.etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Cerrar sesión al final del menú, en rojo como las acciones destructivas del mockup. */}
      <View className="border-t border-borde px-3 py-bloque">
        <Pressable
          onPress={confirmarCierre}
          disabled={cerrando}
          accessibilityRole="button"
          accessibilityState={{ disabled: cerrando, busy: cerrando }}
          className={`h-12 flex-row items-center rounded-campo px-4 active:bg-superficie ${
            cerrando ? 'opacity-50' : ''
          }`}
        >
          <Feather name="log-out" size={22} color={COLORES.error} />
          <Text className="ml-4 font-cuerpo-semi text-base text-error">
            {cerrando ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
