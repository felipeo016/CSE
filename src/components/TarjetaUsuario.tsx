import { Pressable, Text, View } from 'react-native';

import AvatarIniciales from './AvatarIniciales';
import type { EtiquetaRolProps, TarjetaUsuarioProps } from '../types/props.types';
import { NOMBRE_ROL } from '../models/Usuario';

/** Colores de la píldora de cada rol, como en el mockup de Usuarios y roles. */
const ESTILO_ROL = {
  cliente: { fondo: 'bg-primario/15', texto: 'text-primario' },
  trabajador: { fondo: 'bg-exito/15', texto: 'text-exito' },
  administrador: { fondo: 'bg-secundario', texto: 'text-fondo' },
} as const;

/** Píldora con el nombre del rol. */
export function EtiquetaRol({ rol }: EtiquetaRolProps) {
  const estilo = ESTILO_ROL[rol];
  return (
    <View className={`rounded-boton px-3 py-1 ${estilo.fondo}`}>
      <Text className={`font-cuerpo-semi text-sm ${estilo.texto}`}>{NOMBRE_ROL[rol]}</Text>
    </View>
  );
}

/**
 * Tarjeta de un usuario (mockup de Usuarios y roles): iniciales, nombre, correo y rol. Un usuario
 * desactivado se ve atenuado y con la etiqueta "Inactivo" (RF-34).
 */
export default function TarjetaUsuario({ usuario, onPress }: TarjetaUsuarioProps) {
  const estado = usuario.activo ? 'activo' : 'inactivo';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${usuario.nombre}, ${usuario.correo}, ${usuario.rolNombre}, ${estado}`}
      className="mb-bloque flex-row items-center rounded-tarjeta border border-borde bg-fondo p-4 active:opacity-80"
    >
      <View className={usuario.activo ? '' : 'opacity-50'}>
        <AvatarIniciales iniciales={usuario.iniciales} />
      </View>
      <View className="ml-4 mr-2 flex-1">
        <Text
          className={`font-cuerpo-semi text-lg ${usuario.activo ? 'text-texto' : 'text-texto-suave'}`}
          numberOfLines={1}
        >
          {usuario.nombre}
        </Text>
        <Text className="font-cuerpo text-base text-texto-suave" numberOfLines={1}>
          {usuario.correo}
        </Text>
      </View>
      <View className="items-end gap-1">
        <EtiquetaRol rol={usuario.rol} />
        {usuario.activo ? null : (
          <View className="rounded-boton bg-error/15 px-3 py-1">
            <Text className="font-cuerpo-semi text-sm text-error">Inactivo</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
