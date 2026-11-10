import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import Boton from '../../src/components/Boton';
import CampoTexto from '../../src/components/CampoTexto';
import { iniciarSesion as iniciarSesionServidor } from '../../src/services/auth.service';
import { MENSAJE_SESION_EXPIRADA, mensajeDeError } from '../../src/services/api';
import { rutaInicioPorRol } from '../../src/utils/navegacion';
import { correoValido, primerError, requerido } from '../../src/utils/validaciones';

/** Valores del formulario de inicio de sesión (RF-01). */
interface FormularioLogin {
  correo: string;
  contrasena: string;
}

/** Un mensaje de error por campo; null si el campo es válido. */
type ErroresLogin = Record<keyof FormularioLogin, string | null>;

const SIN_ERRORES: ErroresLogin = { correo: null, contrasena: null };

/** Iniciar sesión (RF-01): correo y contraseña con validación al enviar y conexión a Supabase Auth. */
export default function Login() {
  const router = useRouter();
  const [formulario, setFormulario] = useState<FormularioLogin>({ correo: '', contrasena: '' });
  const [errores, setErrores] = useState<ErroresLogin>(SIN_ERRORES);
  // Error que no es de un campo: credenciales incorrectas, sin conexión, cuenta desactivada...
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // api.ts abre esta pantalla con ?aviso=sesion_expirada cuando el token venció (RF-04).
  const { aviso } = useLocalSearchParams<{ aviso?: string }>();
  const [mostrarAviso, setMostrarAviso] = useState(aviso === 'sesion_expirada');

  // Actualiza un campo y borra su error para que el mensaje desaparezca al corregirlo.
  function cambiarCampo(campo: keyof FormularioLogin, valor: string) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: null }));
    setErrorGeneral(null);
  }

  async function iniciarSesion() {
    // Evita el doble envío mientras espera la respuesta.
    if (enviando) {
      return;
    }

    const nuevosErrores: ErroresLogin = {
      correo: primerError(
        requerido(formulario.correo, 'tu correo electrónico'),
        correoValido(formulario.correo),
      ),
      contrasena: requerido(formulario.contrasena, 'tu contraseña'),
    };
    setErrores(nuevosErrores);

    // Con algún campo inválido no se envía la petición.
    if (nuevosErrores.correo || nuevosErrores.contrasena) {
      return;
    }

    setEnviando(true);
    setErrorGeneral(null);
    setMostrarAviso(false);
    try {
      // Supabase Auth valida las credenciales y auth.service guarda la sesión con el rol del perfil.
      const usuario = await iniciarSesionServidor(formulario.correo, formulario.contrasena);
      router.replace(rutaInicioPorRol(usuario.rol));
    } catch (error) {
      // El mensaje ya viene en español desde api.ts: no dice si falló el correo o la contraseña.
      setErrorGeneral(mensajeDeError(error));
      setEnviando(false);
    }
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

          {mostrarAviso ? (
            <Text className="mb-bloque font-cuerpo-semi text-base text-advertencia">
              {MENSAJE_SESION_EXPIRADA}
            </Text>
          ) : null}

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

          {errorGeneral ? (
            <Text className="font-cuerpo text-base text-error" accessibilityLiveRegion="polite">
              {errorGeneral}
            </Text>
          ) : null}

          <View className="mt-seccion">
            <Boton texto="Iniciar sesión" onPress={iniciarSesion} cargando={enviando} />
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
