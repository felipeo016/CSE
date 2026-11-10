import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { CampoTextoProps } from '../types/props.types';

/** Campo de formulario con etiqueta, ícono, mensaje de error bajo el campo y modo contraseña. */
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
}: CampoTextoProps) {
  // Estado local: si la contraseña se ve o se oculta (botón del ojo).
  const [contrasenaVisible, setContrasenaVisible] = useState(false);
  const hayError = Boolean(error);

  return (
    <View className="mb-bloque">
      <Text className="mb-2 font-cuerpo-semi text-base text-texto">{etiqueta}</Text>

      <View
        className={`h-14 flex-row items-center rounded-campo border bg-fondo px-4 ${
          hayError ? 'border-error' : 'border-borde'
        }`}
      >
        {icono ? <Feather name={icono} size={20} color="#0B1F44" style={{ marginRight: 12 }} /> : null}

        <TextInput
          value={valor}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          keyboardType={tipoTeclado}
          secureTextEntry={esContrasena && !contrasenaVisible}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          accessibilityLabel={etiqueta}
          className="flex-1 font-cuerpo text-base text-texto"
        />

        {esContrasena ? (
          <Pressable
            onPress={() => setContrasenaVisible((visible) => !visible)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={contrasenaVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Feather name={contrasenaVisible ? 'eye-off' : 'eye'} size={20} color="#0B1F44" />
          </Pressable>
        ) : null}
      </View>

      {hayError ? <Text className="mt-1 font-cuerpo text-sm text-error">{error}</Text> : null}
    </View>
  );
}
