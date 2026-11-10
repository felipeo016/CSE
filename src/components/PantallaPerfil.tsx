import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import Boton from './Boton';
import CampoTexto from './CampoTexto';
import EstadoVista from './EstadoVista';
import { useActualizarPerfil, usePerfil } from '../hooks/usePerfil';
import { cerrarSesion } from '../services/auth.service';
import { mensajeDeError } from '../services/api';
import { NOMBRE_ROL } from '../models/Usuario';
import type { FormularioPerfilProps } from '../types/props.types';
import { primerError, requerido, telefonoValido } from '../utils/validaciones';

/** Campos editables del formulario de Perfil. */
interface FormularioPerfil {
  nombre: string;
  telefono: string;
}

type ErroresPerfil = Record<keyof FormularioPerfil, string | null>;

const SIN_ERRORES: ErroresPerfil = { nombre: null, telefono: null };

/**
 * Perfil (todos los roles): datos de la cuenta y edición de nombre y teléfono.
 * La usan app/(cliente)/perfil.tsx y app/(trabajador)/perfil.tsx.
 */
export default function PantallaPerfil() {
  const consulta = usePerfil();

  // La pantalla completa se protege arriba y abajo: aún no está dentro del Drawer (J2).
  return (
    <SafeAreaView className="flex-1 bg-fondo">
      {consulta.isPending ? (
        <EstadoVista tipo="carga" mensaje="Cargando su perfil…" />
      ) : consulta.isError ? (
        <EstadoVista
          tipo="error"
          mensaje="No se pudo cargar su perfil"
          detalle={consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />
      ) : (
        <FormularioDePerfil usuario={consulta.data} />
      )}
    </SafeAreaView>
  );
}

/** Formulario con los datos ya cargados. Se separa para iniciar el estado con los datos del servidor. */
function FormularioDePerfil({ usuario }: FormularioPerfilProps) {
  const router = useRouter();
  const guardar = useActualizarPerfil();
  const [formulario, setFormulario] = useState<FormularioPerfil>({
    nombre: usuario.nombre,
    telefono: usuario.telefono ?? '',
  });
  const [errores, setErrores] = useState<ErroresPerfil>(SIN_ERRORES);
  const [cerrando, setCerrando] = useState(false);

  // Si los datos del servidor cambian (por ejemplo, al guardar), el formulario los toma.
  useEffect(() => {
    setFormulario({ nombre: usuario.nombre, telefono: usuario.telefono ?? '' });
  }, [usuario.nombre, usuario.telefono]);

  // Solo se puede guardar si algo cambió (se comparan sin espacios sobrantes).
  const huboCambios =
    formulario.nombre.trim() !== usuario.nombre ||
    formulario.telefono.replace(/\s/g, '') !== (usuario.telefono ?? '');

  function cambiarCampo(campo: keyof FormularioPerfil, valor: string) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: null }));
    guardar.reset(); // borra el mensaje de error o de éxito del intento anterior
  }

  function guardarCambios() {
    const nuevosErrores: ErroresPerfil = {
      nombre: requerido(formulario.nombre, 'su nombre'),
      telefono: primerError(
        requerido(formulario.telefono, 'su teléfono'),
        telefonoValido(formulario.telefono),
      ),
    };
    setErrores(nuevosErrores);
    if (nuevosErrores.nombre || nuevosErrores.telefono) {
      return;
    }
    // mutate no se repite si ya está enviando: el botón queda bloqueado con "cargando".
    guardar.mutate(formulario);
  }

  function confirmarCierre() {
    Alert.alert('Cerrar sesión', '¿Desea cerrar sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          setCerrando(true);
          await cerrarSesion();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerClassName="px-pantalla py-seccion"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="font-titulo text-3xl text-texto">Perfil</Text>

        {/* Datos de la cuenta que el usuario no puede cambiar. */}
        <View className="mb-seccion mt-bloque rounded-campo bg-superficie p-4">
          <Text className="font-cuerpo text-sm text-texto-suave">Correo</Text>
          <Text className="mb-3 font-cuerpo-semi text-base text-texto">{usuario.correo}</Text>
          <Text className="font-cuerpo text-sm text-texto-suave">Rol</Text>
          <Text className="font-cuerpo-semi text-base text-texto">{NOMBRE_ROL[usuario.rol]}</Text>
        </View>

        <CampoTexto
          etiqueta="Nombre"
          valor={formulario.nombre}
          onChangeText={(valor) => cambiarCampo('nombre', valor)}
          placeholder="Laura Gómez"
          error={errores.nombre}
          autoCapitalize="words"
          icono="user"
        />

        <CampoTexto
          etiqueta="Teléfono"
          valor={formulario.telefono}
          onChangeText={(valor) => cambiarCampo('telefono', valor)}
          placeholder="300 123 4567"
          error={errores.telefono}
          tipoTeclado="phone-pad"
          icono="phone"
        />

        {/* Solo se confirma cuando el servidor respondió bien (RNF-08). */}
        {guardar.isSuccess ? (
          <Text className="font-cuerpo-semi text-base text-exito">Sus datos se guardaron</Text>
        ) : null}
        {guardar.isError ? (
          <Text className="font-cuerpo text-base text-error" accessibilityLiveRegion="polite">
            {mensajeDeError(guardar.error)}
          </Text>
        ) : null}

        <View className="mt-seccion">
          <Boton
            texto="Guardar cambios"
            onPress={guardarCambios}
            cargando={guardar.isPending}
            deshabilitado={!huboCambios}
            icono="save"
          />
        </View>

        {/* TEMPORAL hasta J2: Cerrar sesión pasa al Drawer; aquí se conserva mientras tanto. */}
        <View className="mt-bloque">
          <Boton
            texto="Cerrar sesión"
            onPress={confirmarCierre}
            variante="peligro"
            cargando={cerrando}
            icono="log-out"
          />
        </View>

        {/* TEMPORAL hasta J2: sin Drawer, este botón regresa a las pestañas. */}
        {router.canGoBack() ? (
          <View className="mt-bloque">
            <Boton texto="Volver" onPress={() => router.back()} variante="secundario" icono="arrow-left" />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
