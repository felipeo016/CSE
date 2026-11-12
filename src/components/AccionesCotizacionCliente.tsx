import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import Boton from './Boton';
import { COLORES } from '../config/colores';
import { useAceptarCotizacion, useRechazarCotizacion } from '../hooks/useCotizaciones';
import type { ErrorApi } from '../types/api.types';
import type { AccionesClienteCotizacionProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';
import { rutaConfirmacionPedido } from '../utils/navegacion';

type Accion = 'aceptar' | 'rechazar';

/** Error de la última acción, ya listo para mostrar. */
interface ErrorAccion {
  accion: Accion;
  titulo: string;
  mensaje: string;
  /** true si tiene sentido repetir la acción (sin conexión o falla del servidor). */
  reintentable: boolean;
  /** true si falló por falta de conexión (cambia el ícono). */
  sinConexion: boolean;
}

/**
 * Traduce el error del servidor a lo que ve el cliente. Los códigos son los hint de las RPC
 * (docs/servicio-remoto.md); el interceptor de api.ts ya los dejó en error.codigo.
 */
function errorParaMostrar(error: ErrorApi, accion: Accion): Omit<ErrorAccion, 'sinConexion'> {
  const verbo = accion === 'aceptar' ? 'aceptar' : 'rechazar';

  if (error.tipo === 'sin_conexion') {
    return {
      accion,
      titulo: 'Sin conexión',
      mensaje: `No se pudo ${verbo} la cotización y su estado no cambió. Revisa tu conexión y pulsa Reintentar.`,
      reintentable: true,
    };
  }
  if (error.codigo === 'INVENTARIO_INSUFICIENTE') {
    // El mensaje del servidor ya trae el producto y las unidades: "Solo hay 2 unidades disponibles de X".
    return {
      accion,
      titulo: 'No hay inventario suficiente',
      // Se quita el punto final del servidor, si lo trae, para no repetirlo.
      mensaje: `${error.mensaje.replace(/\.$/, '')}. No se creó el pedido. Puedes solicitar una nueva cotización.`,
      reintentable: false,
    };
  }
  if (error.codigo === 'COTIZACION_VENCIDA') {
    return {
      accion,
      titulo: 'La cotización está vencida',
      mensaje: 'Pasó su fecha de vigencia y ya no se puede responder. Puedes solicitar una nueva cotización.',
      reintentable: false,
    };
  }
  if (error.codigo === 'ESTADO_NO_PERMITIDO') {
    return {
      accion,
      titulo: 'Ya no se puede responder',
      mensaje: error.mensaje,
      reintentable: false,
    };
  }
  return {
    accion,
    titulo: `No se pudo ${verbo} la cotización`,
    mensaje: error.mensaje,
    reintentable: error.tipo === 'servidor',
  };
}

/**
 * Aceptar y comprar / Rechazar del cliente (RF-22). Solo se muestra en Nueva o Vista sin vencer
 * (lo decide la pantalla con cotizacion.puedeResponder).
 * - Antes de actuar se pide confirmación.
 * - Nunca se confirma sin respuesta del servidor (RNF-08): sin conexión el estado no cambia, se
 *   informa y Reintentar repite la acción cuando vuelve la conexión.
 * - Los botones quedan bloqueados mientras hay una petición en curso (sin doble envío).
 */
export default function AccionesCotizacionCliente({
  cotizacion,
  onEstadoCambiado,
}: AccionesClienteCotizacionProps) {
  const aceptarMutacion = useAceptarCotizacion();
  const rechazarMutacion = useRechazarCotizacion();
  const [error, setError] = useState<ErrorAccion | null>(null);

  const ocupado = aceptarMutacion.isPending || rechazarMutacion.isPending;

  function manejarError(errorApi: ErrorApi, accion: Accion) {
    const paraMostrar = errorParaMostrar(errorApi, accion);
    setError({ ...paraMostrar, sinConexion: errorApi.tipo === 'sin_conexion' });
    // Si la cotización venció o ya se respondió, se vuelve a pedir para mostrar su estado real.
    if (!paraMostrar.reintentable && errorApi.codigo !== 'INVENTARIO_INSUFICIENTE') {
      onEstadoCambiado();
    }
  }

  function aceptar() {
    setError(null);
    aceptarMutacion.mutate(cotizacion.id, {
      onSuccess: (pedido) => {
        // useAceptarCotizacion ya marcó como viejas las cotizaciones, los productos y los pedidos.
        const unidades = cotizacion.lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
        const servicio = cotizacion.incluyeServicio ? cotizacion.tipoServicioNombre : null;
        // replace: al volver desde la confirmación no se regresa a una cotización ya aceptada.
        router.replace(rutaConfirmacionPedido(pedido, unidades, servicio));
      },
      onError: (errorApi) => manejarError(errorApi, 'aceptar'),
    });
  }

  function rechazar() {
    setError(null);
    rechazarMutacion.mutate(cotizacion.id, {
      onSuccess: () => {
        // La consulta del detalle se vuelve a pedir sola (invalidación) y aparece como Rechazada.
        Alert.alert('Cotización rechazada', `Rechazaste la cotización ${cotizacion.numero}.`);
      },
      onError: (errorApi) => manejarError(errorApi, 'rechazar'),
    });
  }

  function confirmarAceptar() {
    Alert.alert(
      'Aceptar cotización',
      `Se creará un pedido por ${formatearPrecio(cotizacion.total)} con los productos de la cotización ${cotizacion.numero}. ¿Quieres continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceptar y comprar', onPress: aceptar },
      ],
    );
  }

  function confirmarRechazar() {
    Alert.alert(
      'Rechazar cotización',
      `¿Seguro que quieres rechazar la cotización ${cotizacion.numero}? Después no podrás aceptarla.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Rechazar', style: 'destructive', onPress: rechazar },
      ],
    );
  }

  return (
    <View className="mt-2">
      {error ? (
        <View
          className="mb-bloque rounded-tarjeta border border-error bg-error/10 p-4"
          accessibilityLiveRegion="polite"
        >
          <View className="flex-row items-center">
            <Feather
              name={error.sinConexion ? 'wifi-off' : 'alert-circle'}
              size={20}
              color={COLORES.error}
              style={{ marginRight: 8 }}
            />
            <Text className="flex-1 font-cuerpo-semi text-base text-error">{error.titulo}</Text>
          </View>
          <Text className="mt-1 font-cuerpo text-base text-texto">{error.mensaje}</Text>
          {error.reintentable ? (
            <View className="mt-bloque">
              <Boton
                texto="Reintentar"
                icono="refresh-cw"
                variante="secundario"
                cargando={ocupado}
                onPress={error.accion === 'aceptar' ? aceptar : rechazar}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      <Boton
        texto="Aceptar y comprar"
        onPress={confirmarAceptar}
        cargando={aceptarMutacion.isPending}
        deshabilitado={ocupado}
      />
      <View className="mt-bloque">
        <Boton
          texto="Rechazar"
          variante="peligro"
          onPress={confirmarRechazar}
          cargando={rechazarMutacion.isPending}
          deshabilitado={ocupado}
        />
      </View>
    </View>
  );
}
