import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import Boton from '../../../src/components/Boton';
import CampoTexto from '../../../src/components/CampoTexto';
import EstadoVista from '../../../src/components/EstadoVista';
import RutaProtegida from '../../../src/components/RutaProtegida';
import SelectorCliente from '../../../src/components/SelectorCliente';
import { COLORES } from '../../../src/config/colores';
import { useEnLinea } from '../../../src/hooks/useEnLinea';
import { useCrearUbicacion } from '../../../src/hooks/useUbicaciones';
import type { ClienteElegido } from '../../../src/models/FormularioCotizacion';
import { mensajeDeError } from '../../../src/services/api';
import { useMapaStore } from '../../../src/store/mapaStore';
import { useSesionStore } from '../../../src/store/sesionStore';
import type { ErrorApi } from '../../../src/types/api.types';
import type { FormularioUbicacionProps } from '../../../src/types/props.types';
import { formatearCoordenadas } from '../../../src/utils/coordenadas';
import { ROLES_TODOS } from '../../../src/utils/navegacion';
import { requerido } from '../../../src/utils/validaciones';

type ErroresUbicacion = Record<'cliente' | 'punto' | 'direccion', string | null>;

const SIN_ERRORES: ErroresUbicacion = { cliente: null, punto: null, direccion: null };

const MENSAJE_SIN_PUNTO = 'Elige el punto en el mapa o usa tu ubicación actual';
const MENSAJE_SIN_CONEXION =
  'Sin conexión. La ubicación no se guardó. Revisa tu conexión e intenta de nuevo.';

/**
 * Registrar ubicación de servicio (RF-26). Pantalla Stack compartida:
 * - el cliente registra una ubicación propia (desde Mis ubicaciones);
 * - el trabajador o el administrador la registran a nombre de un cliente (desde Ubicaciones).
 * El punto se elige en el Mapa (modo elegir), tocando el lugar o con la ubicación actual.
 */
export default function RegistrarUbicacion() {
  return (
    <RutaProtegida roles={ROLES_TODOS}>
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        <ContenidoRegistro />
      </SafeAreaView>
    </RutaProtegida>
  );
}

/** Decide si el cliente es la propia cuenta o lo elige el personal. */
function ContenidoRegistro() {
  const usuario = useSesionStore((s) => s.usuario);
  if (usuario?.rol === 'cliente') {
    if (!usuario.clienteId) {
      return (
        <EstadoVista
          tipo="error"
          mensaje="Tu cuenta no tiene una ficha de cliente"
          detalle="Comunícate con el negocio para que la revisen."
          accion={{ texto: 'Volver', onPress: () => router.back() }}
        />
      );
    }
    return <FormularioUbicacion clientePropioId={usuario.clienteId} />;
  }
  return <FormularioUbicacion clientePropioId={null} />;
}

function FormularioUbicacion({ clientePropioId }: FormularioUbicacionProps) {
  const crear = useCrearUbicacion();
  const enLinea = useEnLinea();
  // El punto lo deja el Mapa en mapaStore (Zustand) al tocar el mapa o usar "Mi ubicación".
  const punto = useMapaStore((s) => s.puntoSeleccionado);
  const limpiarPunto = useMapaStore((s) => s.limpiarPunto);

  const [cliente, setCliente] = useState<ClienteElegido | null>(null);
  const [direccion, setDireccion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [errores, setErrores] = useState<ErroresUbicacion>(SIN_ERRORES);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [ultimoFueSinConexion, setUltimoFueSinConexion] = useState(false);

  // Registro nuevo: se borra un punto que hubiera quedado de antes. Al salir también se borra.
  useEffect(() => {
    limpiarPunto();
    return () => limpiarPunto();
  }, [limpiarPunto]);

  // Al volver del mapa con un punto, se quita el mensaje "elige el punto".
  useEffect(() => {
    if (punto) {
      setErrores((anteriores) => ({ ...anteriores, punto: null }));
      setErrorEnvio(null);
    }
  }, [punto]);

  function abrirMapa() {
    router.push({
      pathname: '/(cliente)/flujos/mapa',
      // Si ya hay un punto, el mapa abre centrado en él.
      params: punto
        ? { modo: 'elegir', latitud: String(punto.latitud), longitud: String(punto.longitud) }
        : { modo: 'elegir' },
    });
  }

  function validar(): boolean {
    const nuevos: ErroresUbicacion = {
      cliente: clientePropioId === null && !cliente ? 'Elige el cliente de la ubicación' : null,
      punto: punto ? null : MENSAJE_SIN_PUNTO,
      direccion: requerido(direccion, 'la dirección'),
    };
    setErrores(nuevos);
    return !nuevos.cliente && !nuevos.punto && !nuevos.direccion;
  }

  function alFallar(error: ErrorApi) {
    setUltimoFueSinConexion(error.tipo === 'sin_conexion');
    setErrorEnvio(error.tipo === 'sin_conexion' ? MENSAJE_SIN_CONEXION : mensajeDeError(error));
  }

  function guardar() {
    const clienteId = clientePropioId ?? cliente?.id ?? null;
    if (crear.isPending || !validar() || !punto || !clienteId) {
      return;
    }
    // Sin conexión no se intenta: se informa y no se guarda nada (RNF-08).
    if (!enLinea) {
      setUltimoFueSinConexion(true);
      setErrorEnvio(MENSAJE_SIN_CONEXION);
      return;
    }
    setErrorEnvio(null);
    crear.mutate(
      { clienteId, coordenadas: punto, direccion, referencia },
      {
        // Solo se confirma cuando el servidor respondió que guardó (RF-26).
        onSuccess: (guardada) => {
          Alert.alert(
            'Ubicación registrada',
            `${guardada.direccion} ya aparece en el mapa con su propio marcador.`,
          );
          router.back();
        },
        onError: alFallar,
      },
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="px-pantalla py-seccion" keyboardShouldPersistTaps="handled">
        {clientePropioId === null ? (
          <SelectorCliente
            cliente={cliente}
            onElegir={(elegido) => {
              setCliente(elegido);
              setErrores((anteriores) => ({ ...anteriores, cliente: null }));
            }}
            error={errores.cliente}
          />
        ) : null}

        <Text className="mb-2 font-cuerpo-semi text-base text-texto">Punto en el mapa</Text>
        <View
          className={`mb-2 flex-row items-center rounded-campo border px-4 py-3 ${
            errores.punto ? 'border-error' : 'border-borde'
          }`}
        >
          <Feather
            name={punto ? 'map-pin' : 'map'}
            size={20}
            color={punto ? COLORES.exito : COLORES.textoSuave}
            style={{ marginRight: 12 }}
          />
          <Text className={`flex-1 font-cuerpo text-base ${punto ? 'text-texto' : 'text-texto-suave'}`}>
            {punto ? formatearCoordenadas(punto) : 'Aún no has elegido un punto'}
          </Text>
        </View>
        {errores.punto ? <Text className="mb-2 font-cuerpo text-sm text-error">{errores.punto}</Text> : null}
        <Text className="mb-bloque font-cuerpo text-sm text-texto-suave">
          En el mapa puedes tocar el lugar del servicio o pulsar "Mi ubicación" para usar tu posición actual.
        </Text>
        <View className="mb-seccion">
          <Boton
            texto={punto ? 'Cambiar punto en el mapa' : 'Elegir en el mapa'}
            variante="secundario"
            icono="map"
            onPress={abrirMapa}
          />
        </View>

        <CampoTexto
          etiqueta="Dirección"
          valor={direccion}
          onChangeText={(valor) => {
            setDireccion(valor);
            setErrores((anteriores) => ({ ...anteriores, direccion: null }));
            setErrorEnvio(null);
          }}
          placeholder="Calle 10 # 5-20, barrio Centro"
          error={errores.direccion}
          icono="home"
        />

        <CampoTexto
          etiqueta="Referencia (opcional)"
          valor={referencia}
          onChangeText={(valor) => {
            setReferencia(valor);
            setErrorEnvio(null);
          }}
          placeholder="Casa esquinera, portón negro"
          multilinea
        />

        {errorEnvio ? (
          <Text className="mb-bloque font-cuerpo text-base text-error" accessibilityLiveRegion="polite">
            {errorEnvio}
          </Text>
        ) : null}

        <View className="mt-bloque">
          <Boton
            texto={ultimoFueSinConexion && errorEnvio ? 'Reintentar' : 'Guardar ubicación'}
            onPress={guardar}
            cargando={crear.isPending}
            icono={ultimoFueSinConexion && errorEnvio ? 'refresh-cw' : 'save'}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
