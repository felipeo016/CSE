import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import Boton from '../../src/components/Boton';
import CampoTexto from '../../src/components/CampoTexto';
import { registrarCliente } from '../../src/services/auth.service';
import { CODIGOS_AUTH, esErrorApi, mensajeDeError } from '../../src/services/api';
import { rutaInicioPorRol } from '../../src/utils/navegacion';
import {
  contrasenaMinima,
  correoValido,
  primerError,
  requerido,
  telefonoValido,
} from '../../src/utils/validaciones';

/** Valores del formulario de registro de cliente (RF-02). */
interface FormularioRegistro {
  nombre: string;
  correo: string;
  telefono: string;
  contrasena: string;
}

/** Un mensaje de error por campo; null si el campo es válido. */
type ErroresRegistro = Record<keyof FormularioRegistro, string | null>;

const FORMULARIO_VACIO: FormularioRegistro = { nombre: '', correo: '', telefono: '', contrasena: '' };
const SIN_ERRORES: ErroresRegistro = { nombre: null, correo: null, telefono: null, contrasena: null };

/** Registro de cliente (RF-02): nombre, correo, teléfono y contraseña con validación al enviar. */
export default function Registro() {
  const router = useRouter();
  const [formulario, setFormulario] = useState<FormularioRegistro>(FORMULARIO_VACIO);
  const [errores, setErrores] = useState<ErroresRegistro>(SIN_ERRORES);
  // Error que no es de un campo: sin conexión, error del servidor...
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Actualiza un campo y borra su error para que el mensaje desaparezca al corregirlo.
  function cambiarCampo(campo: keyof FormularioRegistro, valor: string) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: null }));
    setErrorGeneral(null);
  }

  async function crearCuenta() {
    // Evita el doble envío mientras espera la respuesta.
    if (enviando) {
      return;
    }

    const nuevosErrores: ErroresRegistro = {
      nombre: requerido(formulario.nombre, 'su nombre'),
      correo: primerError(
        requerido(formulario.correo, 'su correo electrónico'),
        correoValido(formulario.correo),
      ),
      telefono: primerError(
        requerido(formulario.telefono, 'su teléfono'),
        telefonoValido(formulario.telefono),
      ),
      contrasena: primerError(
        requerido(formulario.contrasena, 'una contraseña'),
        contrasenaMinima(formulario.contrasena),
      ),
    };
    setErrores(nuevosErrores);

    // Si algún campo tiene error, no se avanza.
    const hayErrores = Object.values(nuevosErrores).some((error) => error !== null);
    if (hayErrores) {
      return;
    }

    setEnviando(true);
    setErrorGeneral(null);
    try {
      // auth.service quita los espacios del teléfono antes de enviarlo (el servidor exige dígitos).
      const resultado = await registrarCliente(formulario);
      if (resultado.sesionIniciada) {
        router.replace(rutaInicioPorRol(resultado.usuario.rol));
        return;
      }
      // Supabase tiene activo "Confirm email": la cuenta existe, pero hay que confirmar el correo.
      setEnviando(false);
      Alert.alert(
        'Cuenta creada',
        'Revise su correo para confirmar la cuenta y luego inicie sesión.',
        [{ text: 'Aceptar', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (error) {
      setEnviando(false);
      // Correo ya registrado: el mensaje va bajo el campo Correo.
      if (esErrorApi(error) && error.codigo === CODIGOS_AUTH.correoRegistrado) {
        setErrores((anteriores) => ({ ...anteriores, correo: error.mensaje }));
        return;
      }
      setErrorGeneral(mensajeDeError(error));
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
            className="h-24 w-24 self-center"
            resizeMode="contain"
            accessibilityLabel="Logo del Centro de Seguridad Electrónica"
          />

          <Text className="mt-2 text-center font-titulo text-3xl text-texto">Crear cuenta</Text>
          <Text className="mb-seccion mt-1 text-center font-cuerpo text-base text-texto-suave">
            Registra tus datos para continuar
          </Text>

          <CampoTexto
            etiqueta="Nombre"
            valor={formulario.nombre}
            onChangeText={(valor) => cambiarCampo('nombre', valor)}
            placeholder="Laura Gómez"
            error={errores.nombre}
            autoCapitalize="words"
            icono="user"
            etiquetaDentro
          />

          <CampoTexto
            etiqueta="Teléfono"
            valor={formulario.telefono}
            onChangeText={(valor) => cambiarCampo('telefono', valor)}
            placeholder="300 123 4567"
            error={errores.telefono}
            tipoTeclado="phone-pad"
            icono="phone"
            etiquetaDentro
          />

          <CampoTexto
            etiqueta="Correo"
            valor={formulario.correo}
            onChangeText={(valor) => cambiarCampo('correo', valor)}
            placeholder="laura@ejemplo.com"
            error={errores.correo}
            tipoTeclado="email-address"
            autoCapitalize="none"
            icono="mail"
            etiquetaDentro
          />

          <CampoTexto
            etiqueta="Contraseña"
            valor={formulario.contrasena}
            onChangeText={(valor) => cambiarCampo('contrasena', valor)}
            placeholder="Crea una contraseña"
            error={errores.contrasena}
            autoCapitalize="none"
            esContrasena
            icono="lock"
            etiquetaDentro
          />

          {errorGeneral ? (
            <Text className="font-cuerpo text-base text-error" accessibilityLiveRegion="polite">
              {errorGeneral}
            </Text>
          ) : null}

          <View className="mt-bloque">
            <Boton texto="Crear cuenta" onPress={crearCuenta} cargando={enviando} />
          </View>

          <View className="mt-seccion flex-row items-center justify-center">
            <Text className="font-cuerpo text-base text-texto-suave">¿Ya tienes cuenta? </Text>
            {/* Vuelve a Iniciar sesión, que está debajo en el Stack (o la abre si no hay a dónde volver). */}
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
              className="p-2"
              accessibilityRole="link"
            >
              <Text className="font-cuerpo-semi text-base text-primario">Iniciar sesión</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
