import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import Boton from '../../../src/components/Boton';
import CampoTexto from '../../../src/components/CampoTexto';
import EstadoVista from '../../../src/components/EstadoVista';
import RutaProtegida from '../../../src/components/RutaProtegida';
import SelectorSegmentado from '../../../src/components/SelectorSegmentado';
import { useCliente, useCrearCliente, useEditarCliente } from '../../../src/hooks/useClientes';
import { useEnLinea } from '../../../src/hooks/useEnLinea';
import { NOMBRE_TIPO_CLIENTE, type DatosCliente } from '../../../src/models/Cliente';
import type { TipoCliente } from '../../../src/models/Producto';
import { mensajeDeError } from '../../../src/services/api';
import type { ErrorApi } from '../../../src/types/api.types';
import type { ContenidoPorIdProps, FormularioClienteProps } from '../../../src/types/props.types';
import { ROLES_PERSONAL } from '../../../src/utils/navegacion';
import { correoValido, requerido, telefonoValido } from '../../../src/utils/validaciones';

/** Opciones del tipo de cliente: define qué precio ve y paga (decisión del equipo). */
const OPCIONES_TIPO = [
  { valor: 'final', etiqueta: NOMBRE_TIPO_CLIENTE.final },
  { valor: 'instalador', etiqueta: NOMBRE_TIPO_CLIENTE.instalador },
] as const;

type ErroresCliente = Record<'nombre' | 'telefono' | 'correo', string | null>;

const SIN_ERRORES: ErroresCliente = { nombre: null, telefono: null, correo: null };

const MENSAJE_SIN_CONEXION = 'Sin conexión. El cliente no se guardó. Revisa tu conexión e intenta de nuevo.';

/**
 * Formulario de cliente (RF-33). Sin parámetro crea un cliente; con ?id= edita ese cliente.
 * Pantalla Stack: el título va en el encabezado ("Nuevo cliente" o "Editar cliente").
 */
export default function FormularioClientePantalla() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const esEdicion = typeof id === 'string' && id.length > 0;

  return (
    <RutaProtegida roles={ROLES_PERSONAL}>
      <Stack.Screen options={{ title: esEdicion ? 'Editar cliente' : 'Nuevo cliente' }} />
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        {esEdicion ? <EdicionCliente id={id} /> : <FormularioCliente cliente={null} />}
      </SafeAreaView>
    </RutaProtegida>
  );
}

/** Carga el cliente a editar con sus estados de carga, error y "no encontrado". */
function EdicionCliente({ id }: ContenidoPorIdProps) {
  const consulta = useCliente(id);

  if (consulta.isPending) {
    return <EstadoVista tipo="carga" mensaje="Cargando cliente…" />;
  }
  if (consulta.isError && consulta.data === undefined) {
    return (
      <EstadoVista
        tipo="error"
        mensaje="No se pudo cargar el cliente"
        detalle={consulta.error.mensaje}
        accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
      />
    );
  }
  if (!consulta.data) {
    return (
      <EstadoVista
        tipo="vacio"
        mensaje="Cliente no encontrado"
        accion={{ texto: 'Volver', onPress: () => router.back() }}
      />
    );
  }
  // key: si cambia el cliente, el formulario se vuelve a crear con sus datos.
  return <FormularioCliente key={consulta.data.id} cliente={consulta.data} />;
}

/** Formulario con los datos iniciales (vacío al crear; los del cliente al editar). */
function FormularioCliente({ cliente }: FormularioClienteProps) {
  const crear = useCrearCliente();
  const editar = useEditarCliente();
  const enLinea = useEnLinea();

  const [formulario, setFormulario] = useState<DatosCliente>({
    nombre: cliente?.nombre ?? '',
    telefono: cliente?.telefono ?? '',
    correo: cliente?.correo ?? '',
    tipo: cliente?.tipo ?? 'final', // por defecto final (decisión del equipo)
  });
  const [errores, setErrores] = useState<ErroresCliente>(SIN_ERRORES);
  // Error del último intento de guardar (del servidor o por falta de conexión).
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [ultimoFueSinConexion, setUltimoFueSinConexion] = useState(false);

  const guardando = crear.isPending || editar.isPending;

  function cambiarCampo(campo: keyof ErroresCliente, valor: string) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: null }));
    setErrorEnvio(null);
  }

  function cambiarTipo(tipo: TipoCliente) {
    setFormulario((anterior) => ({ ...anterior, tipo }));
    setErrorEnvio(null);
  }

  /** Valida cada campo. Teléfono y correo son opcionales, pero si se escriben deben ser válidos. */
  function validar(): boolean {
    const nuevos: ErroresCliente = {
      nombre: requerido(formulario.nombre, 'el nombre del cliente'),
      telefono: formulario.telefono.trim() === '' ? null : telefonoValido(formulario.telefono),
      correo: formulario.correo.trim() === '' ? null : correoValido(formulario.correo),
    };
    setErrores(nuevos);
    return !nuevos.nombre && !nuevos.telefono && !nuevos.correo;
  }

  function alFallar(error: ErrorApi) {
    setUltimoFueSinConexion(error.tipo === 'sin_conexion');
    setErrorEnvio(error.tipo === 'sin_conexion' ? MENSAJE_SIN_CONEXION : mensajeDeError(error));
  }

  function guardar() {
    if (guardando || !validar()) {
      return;
    }
    // Sin conexión no se intenta: se informa y no se guarda nada (RNF-08).
    if (!enLinea) {
      setUltimoFueSinConexion(true);
      setErrorEnvio(MENSAJE_SIN_CONEXION);
      return;
    }
    setErrorEnvio(null);

    if (cliente) {
      editar.mutate(
        { id: cliente.id, datos: formulario },
        // Solo se sale del formulario cuando el servidor confirmó que guardó.
        { onSuccess: () => router.back(), onError: alFallar },
      );
    } else {
      crear.mutate(formulario, {
        // Al crear se abre el detalle del cliente recién guardado.
        onSuccess: (nuevo) =>
          router.replace({ pathname: '/(trabajador)/flujos/cliente/[id]', params: { id: nuevo.id } }),
        onError: alFallar,
      });
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="px-pantalla py-seccion" keyboardShouldPersistTaps="handled">
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

        <CampoTexto
          etiqueta="Correo"
          valor={formulario.correo}
          onChangeText={(valor) => cambiarCampo('correo', valor)}
          placeholder="laura@ejemplo.com"
          error={errores.correo}
          tipoTeclado="email-address"
          autoCapitalize="none"
          icono="mail"
        />

        <SelectorSegmentado<TipoCliente>
          etiqueta="Tipo de cliente"
          opciones={OPCIONES_TIPO}
          valor={formulario.tipo}
          onCambiar={cambiarTipo}
        />
        <Text className="mb-bloque font-cuerpo text-sm text-texto-suave">
          El tipo define qué precio ve y paga el cliente.
        </Text>

        {errorEnvio ? (
          <Text className="mb-bloque font-cuerpo text-base text-error" accessibilityLiveRegion="polite">
            {errorEnvio}
          </Text>
        ) : null}

        <View className="mt-bloque">
          <Boton
            texto={ultimoFueSinConexion && errorEnvio ? 'Reintentar' : 'Guardar cliente'}
            onPress={guardar}
            cargando={guardando}
            icono={ultimoFueSinConexion && errorEnvio ? 'refresh-cw' : 'save'}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
