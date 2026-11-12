import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import WebView, { type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';

import EstadoVista from './EstadoVista';
import { HTML_MAPA } from '../../assets/mapa/leafletHtml';
import { COLORES } from '../config/colores';
import type { Coordenadas } from '../config/valoresPrueba';
import { useEnLinea } from '../hooks/useEnLinea';
import type { MensajeDesdeMapa, MensajeHaciaMapa, PuntoMapa } from '../models/Mapa';
import type { MapaLeafletProps } from '../types/props.types';
import { aCoordenadas, sonCoordenadasValidas } from '../utils/coordenadas';

/** Si Leaflet no avisa que cargó en este tiempo, se muestra el error con Reintentar (RF-23). */
const ESPERA_CARGA_MS = 20000;

/** Zoom al centrar: 15 muestra varias cuadras alrededor del punto. */
const ZOOM_INICIAL = 15;

// Lista vacía fija para que el valor por defecto no cambie en cada render.
const SIN_PUNTOS: readonly PuntoMapa[] = [];

type EstadoCarga = 'cargando' | 'listo' | 'error';

/** Lee un mensaje de la página. Devuelve null si no tiene la forma esperada. */
function leerMensaje(datos: string): MensajeDesdeMapa | null {
  try {
    const valor: unknown = JSON.parse(datos);
    if (typeof valor !== 'object' || valor === null || !('tipo' in valor)) {
      return null;
    }
    if (valor.tipo === 'listo' || valor.tipo === 'error') {
      return { tipo: valor.tipo };
    }
    if (valor.tipo === 'punto' && 'latitud' in valor && 'longitud' in valor) {
      // Las coordenadas que llegan de la página también se validan como números.
      const punto = aCoordenadas(valor.latitud, valor.longitud);
      return punto ? { tipo: 'punto', ...punto } : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Mapa de OpenStreetMap con Leaflet 1.9.4 dentro de una WebView (RF-23, enfoque de
 * referencia-clase/mapas). La página está en assets/mapa/leafletHtml.ts y se maneja con mensajes:
 * cada vez que cambia una prop se envía el mensaje correspondiente.
 *
 * Tres marcadores distintos: negocio (gota azul marino con escudo), dispositivo (punto azul) y
 * ubicaciones de servicio (gotas verdes). El punto elegido en modo selección es una gota naranja.
 *
 * Si el mapa no carga (sin conexión o fallo) muestra EstadoVista con Reintentar; el resto de la app
 * sigue funcionando porque el fallo queda dentro de este componente.
 */
export default function MapaLeaflet({
  negocio,
  dispositivo = null,
  ubicaciones = SIN_PUNTOS,
  seleccion = null,
  modoSeleccion = false,
  onElegirPunto,
  centroInicial,
  ref,
}: MapaLeafletProps) {
  const webRef = useRef<WebView<WebViewProps>>(null);
  const enLinea = useEnLinea();
  const [estado, setEstado] = useState<EstadoCarga>('cargando');
  // Cambiar el intento vuelve a crear la WebView (botón Reintentar).
  const [intento, setIntento] = useState(0);
  // Centrado pedido antes de que el mapa estuviera listo: se aplica al cargar.
  const centroPendiente = useRef<{ punto: Coordenadas; zoom: number } | null>(null);
  // Siempre la última función recibida, sin volver a registrar el listener de mensajes.
  const alElegirPunto = useRef(onElegirPunto);
  alElegirPunto.current = onElegirPunto;

  /** Envía un mensaje a la página del mapa. */
  const enviar = useCallback((mensaje: MensajeHaciaMapa) => {
    webRef.current?.injectJavaScript(
      `window.recibirMensaje && window.recibirMensaje(${JSON.stringify(mensaje)}); true;`,
    );
  }, []);

  // Acciones disponibles para la pantalla a través de ref (por ejemplo, centrar en mi ubicación).
  useImperativeHandle(
    ref,
    () => ({
      centrar: (punto, zoom = 16) => {
        if (!sonCoordenadasValidas(punto.latitud, punto.longitud)) {
          return;
        }
        if (estado === 'listo') {
          enviar({ tipo: 'centrar', ...punto, zoom });
        } else {
          centroPendiente.current = { punto, zoom };
        }
      },
    }),
    [estado, enviar],
  );

  // Si Leaflet no responde a tiempo se da por fallida la carga. Se limpia el temporizador.
  useEffect(() => {
    if (estado !== 'cargando') {
      return;
    }
    const temporizador = setTimeout(() => setEstado('error'), ESPERA_CARGA_MS);
    return () => clearTimeout(temporizador);
  }, [estado, intento]);

  // Sin conexión antes de cargar: no hay teselas ni Leaflet, se muestra el error de una vez.
  useEffect(() => {
    if (!enLinea && estado === 'cargando') {
      setEstado('error');
    }
  }, [enLinea, estado]);

  // Al quedar listo: centra en el punto pendiente o en el inicial (por defecto, el negocio).
  useEffect(() => {
    if (estado !== 'listo') {
      return;
    }
    const pendiente = centroPendiente.current;
    centroPendiente.current = null;
    const inicio = pendiente ?? { punto: centroInicial ?? negocio, zoom: ZOOM_INICIAL };
    if (sonCoordenadasValidas(inicio.punto.latitud, inicio.punto.longitud)) {
      enviar({ tipo: 'centrar', ...inicio.punto, zoom: inicio.zoom });
    }
    // Solo al terminar de cargar: los cambios posteriores de centroInicial no mueven el mapa,
    // por eso centroInicial y negocio no están en las dependencias.
  }, [estado, enviar]);

  // Cada prop se envía cuando cambia (y otra vez si el mapa se recarga).
  useEffect(() => {
    if (estado === 'listo' && sonCoordenadasValidas(negocio.latitud, negocio.longitud)) {
      enviar({ tipo: 'negocio', latitud: negocio.latitud, longitud: negocio.longitud });
    }
  }, [estado, enviar, negocio.latitud, negocio.longitud]);

  useEffect(() => {
    if (estado !== 'listo') return;
    if (dispositivo && sonCoordenadasValidas(dispositivo.latitud, dispositivo.longitud)) {
      enviar({ tipo: 'dispositivo', latitud: dispositivo.latitud, longitud: dispositivo.longitud });
    } else {
      enviar({ tipo: 'dispositivo', quitar: true });
    }
  }, [estado, enviar, dispositivo?.latitud, dispositivo?.longitud]);

  useEffect(() => {
    if (estado !== 'listo') return;
    if (seleccion && sonCoordenadasValidas(seleccion.latitud, seleccion.longitud)) {
      enviar({ tipo: 'seleccion', latitud: seleccion.latitud, longitud: seleccion.longitud });
    } else {
      enviar({ tipo: 'seleccion', quitar: true });
    }
  }, [estado, enviar, seleccion?.latitud, seleccion?.longitud]);

  useEffect(() => {
    if (estado !== 'listo') return;
    const puntos = ubicaciones
      .filter((p) => sonCoordenadasValidas(p.coordenadas.latitud, p.coordenadas.longitud))
      .map((p) => ({
        latitud: p.coordenadas.latitud,
        longitud: p.coordenadas.longitud,
        titulo: p.titulo,
        detalle: p.detalle ?? '',
      }));
    enviar({ tipo: 'ubicaciones', puntos });
  }, [estado, enviar, ubicaciones]);

  useEffect(() => {
    if (estado === 'listo') {
      enviar({ tipo: 'modoSeleccion', activo: modoSeleccion });
    }
  }, [estado, enviar, modoSeleccion]);

  function alRecibirMensaje(evento: WebViewMessageEvent) {
    const mensaje = leerMensaje(evento.nativeEvent.data);
    if (!mensaje) return;
    if (mensaje.tipo === 'listo') setEstado('listo');
    else if (mensaje.tipo === 'error') setEstado('error');
    else alElegirPunto.current?.({ latitud: mensaje.latitud, longitud: mensaje.longitud });
  }

  function reintentar() {
    setEstado('cargando');
    setIntento((anterior) => anterior + 1);
  }

  if (estado === 'error') {
    return (
      <View className="flex-1 bg-fondo">
        <EstadoVista
          tipo="error"
          mensaje="No se pudo cargar el mapa"
          detalle={
            enLinea
              ? 'Hubo un problema al cargar el mapa. Intenta de nuevo.'
              : 'Revisa tu conexión a internet e intenta de nuevo. Puedes seguir usando el resto de la app.'
          }
          accion={{ texto: 'Reintentar', onPress: reintentar }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-superficie">
      <WebView<WebViewProps>
        key={intento}
        ref={webRef}
        originWhitelist={['*']}
        // baseUrl como en el ejercicio de clase: OpenStreetMap pide un origen para servir teselas.
        source={{ html: HTML_MAPA, baseUrl: 'https://localhost/' }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={alRecibirMensaje}
        onError={() => setEstado('error')}
        onRenderProcessGone={() => setEstado('error')}
        onContentProcessDidTerminate={() => setEstado('error')}
        style={{ flex: 1, backgroundColor: COLORES.superficie }}
      />
      {estado === 'cargando' ? (
        <View className="absolute inset-0 items-center justify-center bg-superficie">
          <ActivityIndicator size="large" color={COLORES.primario} />
        </View>
      ) : null}
    </View>
  );
}
