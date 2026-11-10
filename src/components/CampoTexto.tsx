import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORES } from '../config/colores';
import type { CampoTextoProps } from '../types/props.types';

/**
 * Campo de formulario con etiqueta, ícono, mensaje de error bajo el campo y modo contraseña.
 * La etiqueta va encima del recuadro (Iniciar sesión) o dentro de él (Registro, etiquetaDentro).
 * En ambos casos sigue visible cuando el campo tiene texto.
 */
export default function CampoTexto({
  etiqueta,
  valor,
  onChangeText,
  placeholder,
  error,
  tipoTeclado = 'default',
  esContrasena = false,
  icono,
  autoCapitalize = 'sentences',
  etiquetaDentro = false,
  multilinea = false,
}: CampoTextoProps) {
  // Estado local: si la contraseña se ve o se oculta (botón del ojo).
  const [contrasenaVisible, setContrasenaVisible] = useState(false);
  const hayError = Boolean(error);

  return (
    <View className="mb-bloque">
      {etiquetaDentro ? null : (
        <Text className="mb-2 font-cuerpo-semi text-base text-texto">{etiqueta}</Text>
      )}

      <View
        className={`flex-row rounded-campo border bg-fondo px-4 ${
          multilinea ? 'min-h-32 items-start py-3' : etiquetaDentro ? 'min-h-16 items-center py-2' : 'h-14 items-center'
        } ${hayError ? 'border-error' : 'border-borde'}`}
      >
        {icono ? (
          <Feather name={icono} size={20} color={COLORES.texto} style={{ marginRight: 12 }} />
        ) : null}

        {/* Con la etiqueta dentro, etiqueta y texto se apilan en una columna. */}
        <View className="flex-1">
          {etiquetaDentro ? (
            <Text className="font-cuerpo-medio text-sm text-texto">{etiqueta}</Text>
          ) : null}

          <TextInput
            value={valor}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORES.textoSuave}
            keyboardType={tipoTeclado}
            secureTextEntry={esContrasena && !contrasenaVisible}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            accessibilityLabel={etiqueta}
            multiline={multilinea}
            // En varias líneas el texto empieza arriba (en Android se centraría).
            textAlignVertical={multilinea ? 'top' : 'center'}
            numberOfLines={multilinea ? 4 : undefined}
            // Sin el relleno por defecto de Android, para que el texto quede alineado con la etiqueta.
            className={`font-cuerpo text-base text-texto ${etiquetaDentro || multilinea ? 'p-0' : ''} ${
              multilinea ? 'min-h-24' : ''
            }`}
          />
        </View>

        {esContrasena ? (
          <Pressable
            onPress={() => setContrasenaVisible((visible) => !visible)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={contrasenaVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Feather name={contrasenaVisible ? 'eye-off' : 'eye'} size={20} color={COLORES.texto} />
          </Pressable>
        ) : null}
      </View>

      {hayError ? <Text className="mt-1 font-cuerpo text-sm text-error">{error}</Text> : null}
    </View>
  );
}
