import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import Boton from '../../src/components/Boton';
import CampoTexto from '../../src/components/CampoTexto';
import { correoValido, primerError, requerido } from '../../src/utils/validaciones';

/** Valores del formulario de inicio de sesión (RF-01). */
interface FormularioLogin {
  correo: string;
  contrasena: string;
}

/** Un mensaje de error por campo; null si el campo es válido. */
type ErroresLogin = Record<keyof FormularioLogin, string | null>;

const SIN_ERRORES: ErroresLogin = { correo: null, contrasena: null };

/** Iniciar sesión (RF-01): correo y contraseña con validación al enviar. */
export default function Login() {
  const router = useRouter();
  const [formulario, setFormulario] = useState<FormularioLogin>({ correo: '', contrasena: '' });
  const [errores, setErrores] = useState<ErroresLogin>(SIN_ERRORES);

  // Actualiza un campo y borra su error para que el mensaje desaparezca al corregirlo.
  function cambiarCampo(campo: keyof FormularioLogin, valor: string) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: null }));
  }

  function iniciarSesion() {
    const nuevosErrores: ErroresLogin = {
      correo: primerError(
        requerido(formulario.correo, 'su correo electrónico'),
        correoValido(formulario.correo),
      ),
      contrasena: requerido(formulario.contrasena, 'su contraseña'),
    };
    setErrores(nuevosErrores);

    // Con algún campo inválido no se avanza (y en F3 no se enviará la petición).
    if (nuevosErrores.correo || nuevosErrores.contrasena) {
      return;
    }

    // TEMPORAL hasta F3: aquí F3 enviará las credenciales a Supabase Auth y abrirá las pestañas
    // del rol que devuelva el servidor. Por ahora todo envío válido lleva a las pestañas del cliente.
    router.replace('/(cliente)/(tabs)/inicio');
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      {/* Sube el formulario cuando aparece el teclado para que ningún campo quede tapado. */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-pantalla py-seccion"
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../assets/images/logo.png')}
            className="mb-seccion h-36 w-36 self-center"
            resizeMode="contain"
            accessibilityLabel="Logo del Centro de Seguridad Electrónica"
          />

          <Text className="font-titulo text-4xl text-texto">Bienvenido</Text>
          <Text className="mb-seccion mt-1 font-cuerpo text-lg text-texto-suave">
            Inicia sesión para continuar
          </Text>

          <CampoTexto
            etiqueta="Correo electrónico"
            valor={formulario.correo}
            onChangeText={(valor) => cambiarCampo('correo', valor)}
            placeholder="tucorreo@ejemplo.com"
            error={errores.correo}
            tipoTeclado="email-address"
            autoCapitalize="none"
            icono="mail"
          />

          <CampoTexto
            etiqueta="Contraseña"
            valor={formulario.contrasena}
            onChangeText={(valor) => cambiarCampo('contrasena', valor)}
            placeholder="Ingresa tu contraseña"
            error={errores.contrasena}
            autoCapitalize="none"
            esContrasena
            icono="lock"
          />

          <View className="mt-seccion">
            <Boton texto="Iniciar sesión" onPress={iniciarSesion} />
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/registro')}
            className="mt-seccion self-center p-2"
            accessibilityRole="link"
          >
            <Text className="font-cuerpo-semi text-lg text-primario">Crear cuenta</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
