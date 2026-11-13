import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import Boton from '../../../src/components/Boton';
import CampoTexto from '../../../src/components/CampoTexto';
import EstadoVista from '../../../src/components/EstadoVista';
import RutaProtegida from '../../../src/components/RutaProtegida';
import SelectorOpciones from '../../../src/components/SelectorOpciones';
import { COLORES } from '../../../src/config/colores';
import { useEnLinea } from '../../../src/hooks/useEnLinea';
import {
  useCambiarEstadoUsuario,
  useCrearUsuario,
  useEditarUsuario,
  useUsuario,
} from '../../../src/hooks/useUsuarios';
import { NOMBRE_ROL, type DatosUsuarioAdmin, type Rol } from '../../../src/models/Usuario';
import { mensajeDeError } from '../../../src/services/api';
import { useSesionStore } from '../../../src/store/sesionStore';
import type { ErrorApi } from '../../../src/types/api.types';
import type { ContenidoPorIdProps, FormularioUsuarioProps } from '../../../src/types/props.types';
import { ROLES_ADMINISTRADOR } from '../../../src/utils/navegacion';
import {
  contrasenaMinima,
  correoValido,
  primerError,
  requerido,
  telefonoValido,
} from '../../../src/utils/validaciones';

/** Opciones del rol (RF-34). */
const OPCIONES_ROL = [
  { valor: 'cliente', etiqueta: NOMBRE_ROL.cliente },
  { valor: 'trabajador', etiqueta: NOMBRE_ROL.trabajador },
  { valor: 'administrador', etiqueta: NOMBRE_ROL.administrador },
] as const;

type CampoUsuario = 'nombre' | 'correo' | 'telefono' | 'contrasena';
type ErroresUsuario = Record<CampoUsuario, string | null>;

const SIN_ERRORES: ErroresUsuario = { nombre: null, correo: null, telefono: null, contrasena: null };

const MENSAJE_SIN_CONEXION = 'Sin conexión. No se guardó nada. Revisa tu conexión e intenta de nuevo.';

/**
 * Formulario de usuario (RF-34), solo para el administrador. Sin parámetro crea un usuario; con
 * ?id= edita ese usuario y permite activarlo o desactivarlo. Los cambios los hace la Edge
 * Function admin-usuarios (la app nunca tiene la llave secreta).
 */
export default function FormularioUsuarioPantalla() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const esEdicion = typeof id === 'string' && id.length > 0;

  return (
    <RutaProtegida roles={ROLES_ADMINISTRADOR}>
      <Stack.Screen options={{ title: esEdicion ? 'Editar usuario' : 'Nuevo usuario' }} />
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        {esEdicion ? <EdicionUsuario id={id} /> : <FormularioUsuario usuario={null} />}
      </SafeAreaView>
    </RutaProtegida>
  );
}

/** Carga el usuario a editar con sus estados de carga, error y "no encontrado". */
function EdicionUsuario({ id }: ContenidoPorIdProps) {
  const consulta = useUsuario(id);

  if (consulta.isPending) {
    return <EstadoVista tipo="carga" mensaje="Cargando usuario…" />;
  }
  if (consulta.isError && consulta.data === undefined) {
    return (
      <EstadoVista
        tipo="error"
        mensaje="No se pudo cargar el usuario"
        detalle={consulta.error.mensaje}
        accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
      />
    );
  }
  if (!consulta.data) {
    return (
      <EstadoVista
        tipo="vacio"
        mensaje="Usuario no encontrado"
        accion={{ texto: 'Volver', onPress: () => router.back() }}
      />
    );
  }
  return <FormularioUsuario key={consulta.data.id} usuario={consulta.data} />;
}

function FormularioUsuario({ usuario }: FormularioUsuarioProps) {
  const crear = useCrearUsuario();
  const editar = useEditarUsuario();
  const cambiarEstado = useCambiarEstadoUsuario();
  const enLinea = useEnLinea();
  const miId = useSesionStore((estado) => estado.usuario?.id);

  const esEdicion = usuario !== null;
  // Nadie cambia su propio rol ni se desactiva a sí mismo (lo exige también el servidor).
  const esMiCuenta = usuario !== null && usuario.id === miId;

  const [formulario, setFormulario] = useState<DatosUsuarioAdmin>({
    nombre: usuario?.nombre ?? '',
    correo: usuario?.correo ?? '',
    telefono: usuario?.telefono ?? '',
    contrasena: '',
    // Al crear, trabajador por defecto: el botón del mockup es "Crear trabajador".
    rol: usuario?.rol ?? 'trabajador',
  });
  const [errores, setErrores] = useState<ErroresUsuario>(SIN_ERRORES);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [ultimoFueSinConexion, setUltimoFueSinConexion] = useState(false);

  const guardando = crear.isPending || editar.isPending;

  function cambiarCampo(campo: CampoUsuario, valor: string) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: null }));
    setErrorEnvio(null);
  }

  function cambiarRol(rol: Rol) {
    setFormulario((anterior) => ({ ...anterior, rol }));
    setErrorEnvio(null);
  }

  /** Un mensaje por campo. Correo y contraseña solo se validan al crear. */
  function validar(): boolean {
    const nuevos: ErroresUsuario = {
      nombre: requerido(formulario.nombre, 'el nombre'),
      telefono: primerError(requerido(formulario.telefono, 'el teléfono'), telefonoValido(formulario.telefono)),
      correo: esEdicion
        ? null
        : primerError(requerido(formulario.correo, 'el correo'), correoValido(formulario.correo)),
      contrasena: esEdicion
        ? null
        : primerError(requerido(formulario.contrasena, 'una contraseña temporal'), contrasenaMinima(formulario.contrasena)),
    };
    setErrores(nuevos);
    return Object.values(nuevos).every((mensaje) => mensaje === null);
  }

  function alFallar(error: ErrorApi) {
    const sinConexion = error.tipo === 'sin_conexion';
    if (error.codigo === 'CORREO_REGISTRADO') {
      // Si el intento anterior se cortó, el usuario pudo quedar creado en el servidor.
      setErrores((anteriores) => ({
        ...anteriores,
        correo: ultimoFueSinConexion
          ? `${error.mensaje}. Si tu intento anterior se cortó, pudo quedar creado: revisa la lista.`
          : error.mensaje,
      }));
      setErrorEnvio(null);
    } else {
      setErrorEnvio(sinConexion ? MENSAJE_SIN_CONEXION : mensajeDeError(error));
    }
    setUltimoFueSinConexion(sinConexion);
  }

  function guardar() {
    if (guardando || !validar()) {
      return;
    }
    // Sin conexión no se intenta: se informa y no se crea nada (RNF-08).
    if (!enLinea) {
      setUltimoFueSinConexion(true);
      setErrorEnvio(MENSAJE_SIN_CONEXION);
      return;
    }
    setErrorEnvio(null);

    // Solo se sale del formulario cuando el servidor confirmó que guardó.
    if (usuario) {
      editar.mutate({ id: usuario.id, datos: formulario }, { onSuccess: () => router.back(), onError: alFallar });
    } else {
      crear.mutate(formulario, {
        onSuccess: (nuevo) => {
          Alert.alert('Usuario creado', `${nuevo.nombre} ya puede iniciar sesión con la contraseña temporal.`);
          router.back();
        },
        onError: alFallar,
      });
    }
  }

  /** Activar o desactivar, con confirmación. */
  function confirmarCambioEstado() {
    if (!usuario || cambiarEstado.isPending) return;
    const activar = !usuario.activo;
    if (!enLinea) {
      setErrorEnvio(MENSAJE_SIN_CONEXION);
      return;
    }
    Alert.alert(
      activar ? 'Activar usuario' : 'Desactivar usuario',
      activar
        ? `${usuario.nombre} podrá volver a iniciar sesión.`
        : `${usuario.nombre} no podrá iniciar sesión hasta que lo actives de nuevo. Sus datos se conservan.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: activar ? 'Activar' : 'Desactivar',
          style: activar ? 'default' : 'destructive',
          onPress: () => {
            setErrorEnvio(null);
            cambiarEstado.mutate(
              { id: usuario.id, activo: activar },
              {
                onSuccess: () => router.back(),
                onError: (error) =>
                  setErrorEnvio(error.tipo === 'sin_conexion' ? MENSAJE_SIN_CONEXION : mensajeDeError(error)),
              },
            );
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="px-pantalla py-seccion" keyboardShouldPersistTaps="handled">
        <CampoTexto
          etiqueta="Nombre"
          valor={formulario.nombre}
          onChangeText={(valor) => cambiarCampo('nombre', valor)}
          placeholder="Carlos Ramírez"
          error={errores.nombre}
          autoCapitalize="words"
          icono="user"
        />

        {esEdicion ? (
          // El correo identifica la cuenta y no se cambia.
          <View className="mb-bloque">
            <Text className="mb-2 font-cuerpo-semi text-base text-texto">Correo</Text>
            <View className="min-h-14 flex-row items-center rounded-campo border border-borde bg-superficie px-4">
              <Feather name="mail" size={20} color={COLORES.textoSuave} style={{ marginRight: 10 }} />
              <Text className="flex-1 font-cuerpo text-base text-texto-suave" selectable>
                {formulario.correo}
              </Text>
            </View>
            <Text className="mt-1 font-cuerpo text-sm text-texto-suave">El correo no se puede cambiar.</Text>
          </View>
        ) : (
          <CampoTexto
            etiqueta="Correo"
            valor={formulario.correo}
            onChangeText={(valor) => cambiarCampo('correo', valor)}
            placeholder="carlos@ejemplo.com"
            error={errores.correo}
            tipoTeclado="email-address"
            autoCapitalize="none"
            icono="mail"
          />
        )}

        <CampoTexto
          etiqueta="Teléfono"
          valor={formulario.telefono}
          onChangeText={(valor) => cambiarCampo('telefono', valor)}
          placeholder="300 123 4567"
          error={errores.telefono}
          tipoTeclado="phone-pad"
          icono="phone"
        />

        {esEdicion ? null : (
          <>
            <CampoTexto
              etiqueta="Contraseña temporal"
              valor={formulario.contrasena}
              onChangeText={(valor) => cambiarCampo('contrasena', valor)}
              placeholder="Mínimo 6 caracteres"
              error={errores.contrasena}
              esContrasena
              autoCapitalize="none"
              icono="lock"
            />
            <Text className="-mt-2 mb-bloque font-cuerpo text-sm text-texto-suave">
              Entrégasela a la persona para su primer inicio de sesión.
            </Text>
          </>
        )}

        {esMiCuenta ? (
          <View className="mb-bloque">
            <Text className="mb-2 font-cuerpo-semi text-base text-texto">Rol</Text>
            <Text className="font-cuerpo text-base text-texto">{NOMBRE_ROL[formulario.rol]}</Text>
            <Text className="mt-1 font-cuerpo text-sm text-texto-suave">
              No puedes cambiar tu propio rol ni desactivar tu propia cuenta.
            </Text>
          </View>
        ) : (
          <SelectorOpciones<Rol> etiqueta="Rol" opciones={OPCIONES_ROL} valor={formulario.rol} onCambiar={cambiarRol} />
        )}

        {errorEnvio ? (
          <Text className="mb-bloque font-cuerpo text-base text-error" accessibilityLiveRegion="polite">
            {errorEnvio}
          </Text>
        ) : null}

        <View className="mt-bloque">
          <Boton
            texto={ultimoFueSinConexion && errorEnvio ? 'Reintentar' : esEdicion ? 'Guardar cambios' : 'Crear usuario'}
            onPress={guardar}
            cargando={guardando}
            deshabilitado={cambiarEstado.isPending}
            icono={ultimoFueSinConexion && errorEnvio ? 'refresh-cw' : esEdicion ? 'save' : 'user-plus'}
          />
        </View>

        {usuario && !esMiCuenta ? (
          <View className="mt-bloque">
            <Boton
              texto={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
              variante={usuario.activo ? 'peligro' : 'secundario'}
              icono={usuario.activo ? 'user-x' : 'user-check'}
              onPress={confirmarCambioEstado}
              cargando={cambiarEstado.isPending}
              deshabilitado={guardando}
            />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
