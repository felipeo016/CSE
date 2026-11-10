import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import Boton from '../../../src/components/Boton';
import CampoTexto from '../../../src/components/CampoTexto';
import RutaProtegida from '../../../src/components/RutaProtegida';
import SelectorProductosInteres from '../../../src/components/SelectorProductosInteres';
import SelectorSegmentado from '../../../src/components/SelectorSegmentado';
import { COLORES } from '../../../src/config/colores';
import { useCrearSolicitudCotizacion } from '../../../src/hooks/useCotizaciones';
import { useEnLinea } from '../../../src/hooks/useEnLinea';
import {
  NOMBRE_ESTADO_COTIZACION,
  NOMBRE_TIPO_SERVICIO,
  type TipoServicio,
} from '../../../src/models/Cotizacion';
import { mensajeDeError } from '../../../src/services/api';
import type { ErrorApi } from '../../../src/types/api.types';
import type { ConfirmacionSolicitudProps, ProductoElegido } from '../../../src/types/props.types';
import { ROLES_CLIENTE } from '../../../src/utils/navegacion';
import { requerido } from '../../../src/utils/validaciones';

const OPCIONES_SERVICIO = [
  { valor: 'instalacion', etiqueta: NOMBRE_TIPO_SERVICIO.instalacion },
  { valor: 'mantenimiento', etiqueta: NOMBRE_TIPO_SERVICIO.mantenimiento },
] as const;

const MENSAJE_SIN_CONEXION =
  'Sin conexión. Su solicitud no se envió. Revise su conexión e intente de nuevo.';

interface ErroresSolicitud {
  tipoServicio: string | null;
  descripcion: string | null;
}

/**
 * Solicitar cotización (RF-15), flujo Stack del cliente: tipo de servicio, descripción de la
 * necesidad y productos de interés opcionales. Al enviar, el servidor la guarda como Solicitada
 * junto con sus productos en una sola transacción. Solo se confirma con respuesta del servidor.
 */
export default function SolicitarCotizacion() {
  return (
    <RutaProtegida roles={ROLES_CLIENTE}>
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        <FormularioSolicitud />
      </SafeAreaView>
    </RutaProtegida>
  );
}

function FormularioSolicitud() {
  const enviar = useCrearSolicitudCotizacion();
  const enLinea = useEnLinea();

  const [tipoServicio, setTipoServicio] = useState<TipoServicio | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [productos, setProductos] = useState<ProductoElegido[]>([]);
  const [errores, setErrores] = useState<ErroresSolicitud>({ tipoServicio: null, descripcion: null });
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [ultimoFueSinConexion, setUltimoFueSinConexion] = useState(false);

  // La confirmación solo aparece cuando el servidor respondió que guardó la solicitud.
  if (enviar.isSuccess) {
    return <ConfirmacionSolicitud solicitud={enviar.data} />;
  }

  function alFallar(error: ErrorApi) {
    setUltimoFueSinConexion(error.tipo === 'sin_conexion');
    setErrorEnvio(error.tipo === 'sin_conexion' ? MENSAJE_SIN_CONEXION : mensajeDeError(error));
  }

  function enviarSolicitud() {
    if (enviar.isPending) {
      return; // evita el doble envío (el botón además queda bloqueado mientras carga)
    }

    // Mensaje por campo (RF-15).
    const nuevos: ErroresSolicitud = {
      tipoServicio: tipoServicio === null ? 'Elija el tipo de servicio' : null,
      descripcion: requerido(descripcion, 'la descripción de su necesidad'),
    };
    setErrores(nuevos);
    if (nuevos.tipoServicio || nuevos.descripcion || tipoServicio === null) {
      return;
    }

    // Sin conexión no se intenta: se informa y no se crea nada (RNF-08).
    if (!enLinea) {
      setUltimoFueSinConexion(true);
      setErrorEnvio(MENSAJE_SIN_CONEXION);
      return;
    }
    setErrorEnvio(null);

    enviar.mutate(
      {
        tipoServicio,
        descripcion,
        productosInteres: productos.map((producto) => ({ productoId: producto.id })),
      },
      { onError: alFallar },
    );
  }

  const mostrarReintentar = ultimoFueSinConexion && errorEnvio !== null;

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="px-pantalla py-seccion" keyboardShouldPersistTaps="handled">
        <SelectorSegmentado<TipoServicio>
          etiqueta="Tipo de servicio"
          opciones={OPCIONES_SERVICIO}
          valor={tipoServicio}
          onCambiar={(valor) => {
            setTipoServicio(valor);
            setErrores((anteriores) => ({ ...anteriores, tipoServicio: null }));
            setErrorEnvio(null);
          }}
          error={errores.tipoServicio}
        />

        <CampoTexto
          etiqueta="Descripción"
          valor={descripcion}
          onChangeText={(valor) => {
            setDescripcion(valor);
            setErrores((anteriores) => ({ ...anteriores, descripcion: null }));
            setErrorEnvio(null);
          }}
          placeholder="Cuéntanos qué necesitas"
          error={errores.descripcion}
          multilinea
        />

        <SelectorProductosInteres elegidos={productos} onCambiar={setProductos} />

        {errorEnvio ? (
          <Text className="mb-bloque font-cuerpo text-base text-error" accessibilityLiveRegion="polite">
            {errorEnvio}
          </Text>
        ) : null}

        <View className="mt-bloque">
          <Boton
            texto={mostrarReintentar ? 'Reintentar' : 'Enviar solicitud'}
            onPress={enviarSolicitud}
            cargando={enviar.isPending}
            icono={mostrarReintentar ? 'refresh-cw' : undefined}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Solicitud registrada: número y estado devueltos por el servidor. */
function ConfirmacionSolicitud({ solicitud }: ConfirmacionSolicitudProps) {
  return (
    <View className="flex-1 items-center justify-center px-pantalla">
      <Feather name="check-circle" size={64} color={COLORES.exito} />
      <Text className="mt-5 text-center font-titulo text-2xl text-texto">Solicitud enviada</Text>
      <Text className="mt-2 text-center font-cuerpo text-base text-texto-suave">
        Su solicitud {solicitud.numero} quedó en estado {NOMBRE_ESTADO_COTIZACION[solicitud.estado]}.
        Un trabajador la revisará y le enviará la cotización a su bandeja.
      </Text>
      <View className="mt-seccion w-full max-w-xs">
        <Boton texto="Volver a Cotizaciones" onPress={() => router.back()} />
      </View>
    </View>
  );
}
