import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import AvisoUbicacion from '../../../src/components/AvisoUbicacion';
import Boton from '../../../src/components/Boton';
import MapaLeaflet from '../../../src/components/MapaLeaflet';
import PanelSeguimiento from '../../../src/components/PanelSeguimiento';
import RutaProtegida from '../../../src/components/RutaProtegida';
import { COLORES } from '../../../src/config/colores';
import { COORDENADAS_NEGOCIO } from '../../../src/config/valoresPrueba';
import { MENSAJE_GPS_APAGADO, useUbicacion } from '../../../src/hooks/useUbicacion';
import { useUbicacionesSegunRol } from '../../../src/hooks/useUbicaciones';
import type { PuntoMapa } from '../../../src/models/Mapa';
import { useMapaStore } from '../../../src/store/mapaStore';
import { useSesionStore } from '../../../src/store/sesionStore';
import type { ContenidoMapaProps, ControlMapa } from '../../../src/types/props.types';
import { aCoordenadas, formatearCoordenadas } from '../../../src/utils/coordenadas';
import { ROLES_TODOS } from '../../../src/utils/navegacion';

/**
 * Mapa compartido por cliente, trabajador y administrador (RF-23 a RF-26). Pantalla Stack.
 * Parámetros de la ruta:
 * - modo=negocio (por defecto): negocio, ubicaciones de servicio, mi ubicación y seguimiento.
 * - modo=elegir: tocar el mapa marca el punto del formulario Registrar ubicación.
 * - latitud y longitud (opcionales): dónde centrar al abrir. Se validan como números.
 */
export default function Mapa() {
  const { modo, latitud, longitud } = useLocalSearchParams<{
    modo?: string;
    latitud?: string;
    longitud?: string;
  }>();
  const modoMapa = modo === 'elegir' ? 'elegir' : 'negocio';

  return (
    <RutaProtegida roles={ROLES_TODOS}>
      <Stack.Screen options={{ title: modoMapa === 'elegir' ? 'Elegir punto' : 'Mapa' }} />
      <ContenidoMapa modo={modoMapa} centro={aCoordenadas(latitud, longitud)} />
    </RutaProtegida>
  );
}

function ContenidoMapa({ modo, centro }: ContenidoMapaProps) {
  const esElegir = modo === 'elegir';
  const mapaRef = useRef<ControlMapa>(null);
  // Hook propio: permiso, GPS, posición y seguimiento. obtenerActual centra el mapa.
  const ubicacion = useUbicacion({ alCentrar: (punto) => mapaRef.current?.centrar(punto) });
  const consulta = useUbicacionesSegunRol();
  const esPersonal = useSesionStore((s) => s.usuario?.rol !== 'cliente');
  const puntoSeleccionado = useMapaStore((s) => s.puntoSeleccionado);
  const elegirPunto = useMapaStore((s) => s.elegirPunto);

  // "Continuar sin ubicación" oculta el aviso; vuelve a mostrarse si cambia el estado.
  const [avisoCerrado, setAvisoCerrado] = useState(false);
  useEffect(() => {
    setAvisoCerrado(false);
  }, [ubicacion.estado]);

  // Ubicaciones de servicio → marcadores. El personal ve también el nombre del cliente.
  const puntos = useMemo<PuntoMapa[]>(
    () =>
      (consulta.data ?? []).map((u) => ({
        id: u.id,
        coordenadas: u.coordenadas,
        titulo: u.direccion,
        detalle: [esPersonal ? u.clienteNombre : null, u.referencia].filter(Boolean).join(' · '),
      })),
    [consulta.data, esPersonal],
  );

  /** Botón "Mi ubicación": centra el mapa y, en modo elegir, usa esa posición como punto. */
  async function irAMiUbicacion() {
    const punto = await ubicacion.obtenerActual();
    if (punto && esElegir) {
      elegirPunto(punto);
    }
  }

  function aviso() {
    if (avisoCerrado) return null;
    if (ubicacion.estado === 'sin_permiso') {
      return (
        <AvisoUbicacion
          icono="map-pin"
          color={COLORES.error}
          titulo="Necesitamos tu ubicación"
          detalle={ubicacion.mensaje ?? ''}
          accionPrincipal={{ texto: 'Abrir ajustes', icono: 'settings', onPress: ubicacion.abrirAjustes }}
          onCerrar={() => setAvisoCerrado(true)}
        />
      );
    }
    if (ubicacion.estado === 'gps_apagado') {
      return (
        <AvisoUbicacion
          icono="crosshair"
          color={COLORES.advertencia}
          titulo={MENSAJE_GPS_APAGADO}
          detalle="Enciende la ubicación del teléfono e inténtalo de nuevo."
          accionPrincipal={{ texto: 'Reintentar', icono: 'refresh-cw', onPress: () => void irAMiUbicacion() }}
          onCerrar={() => setAvisoCerrado(true)}
        />
      );
    }
    if (ubicacion.estado === 'error') {
      return (
        <AvisoUbicacion
          icono="alert-circle"
          color={COLORES.error}
          titulo="No pudimos obtener tu ubicación"
          detalle="Revisa que tengas señal de GPS e inténtalo de nuevo."
          accionPrincipal={{ texto: 'Reintentar', icono: 'refresh-cw', onPress: () => void irAMiUbicacion() }}
          onCerrar={() => setAvisoCerrado(true)}
        />
      );
    }
    return null;
  }

  const tarjetaAviso = aviso();

  return (
    <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
      {ubicacion.estado === 'gps_apagado' ? (
        <View className="flex-row items-center bg-advertencia/20 px-pantalla py-2">
          <Feather name="alert-triangle" size={18} color={COLORES.advertencia} style={{ marginRight: 8 }} />
          <Text className="font-cuerpo-medio text-sm text-texto">GPS desactivado</Text>
        </View>
      ) : null}

      {esElegir ? (
        <View className="flex-row items-center bg-primario/10 px-pantalla py-3">
          <Feather name="info" size={18} color={COLORES.primario} style={{ marginRight: 8 }} />
          <Text className="flex-1 font-cuerpo text-sm text-texto">
            Toca el mapa para marcar el lugar del servicio o usa tu ubicación actual.
          </Text>
        </View>
      ) : null}

      <View className="flex-1">
        <MapaLeaflet
          ref={mapaRef}
          negocio={COORDENADAS_NEGOCIO}
          dispositivo={ubicacion.posicion}
          ubicaciones={puntos}
          seleccion={esElegir ? puntoSeleccionado : null}
          modoSeleccion={esElegir}
          onElegirPunto={elegirPunto}
          centroInicial={centro ?? (esElegir ? (puntoSeleccionado ?? undefined) : undefined)}
        />

        {consulta.isError ? (
          <Pressable
            onPress={() => void consulta.refetch()}
            accessibilityRole="button"
            className="absolute left-3 right-3 top-3 flex-row items-center rounded-campo bg-fondo px-4 py-3"
            style={{ elevation: 4 }}
          >
            <Feather name="alert-circle" size={18} color={COLORES.error} style={{ marginRight: 8 }} />
            <Text className="flex-1 font-cuerpo text-sm text-texto">
              No se pudieron cargar las ubicaciones registradas. Toca para reintentar.
            </Text>
          </Pressable>
        ) : null}

        {/* Botón flotante "Mi ubicación" (mockup): pide el permiso solo al pulsarlo (RNF-13). */}
        <View className="absolute bottom-4 right-4 items-center">
          <Pressable
            onPress={() => void irAMiUbicacion()}
            disabled={ubicacion.ocupado}
            accessibilityRole="button"
            accessibilityLabel="Mi ubicación"
            className="h-14 w-14 items-center justify-center rounded-boton bg-fondo active:opacity-80"
            style={{ elevation: 4 }}
          >
            {ubicacion.ocupado ? (
              <ActivityIndicator color={COLORES.primario} />
            ) : (
              <Feather name="crosshair" size={26} color={COLORES.texto} />
            )}
          </Pressable>
          <View className="mt-1 rounded-boton bg-fondo px-3 py-1" style={{ elevation: 2 }}>
            <Text className="font-cuerpo-medio text-sm text-texto">Mi ubicación</Text>
          </View>
        </View>

        {tarjetaAviso ? (
          <View className="absolute inset-0 justify-center bg-texto/20">{tarjetaAviso}</View>
        ) : null}
      </View>

      {esElegir ? (
        <View className="rounded-t-tarjeta bg-fondo px-pantalla pb-4 pt-4">
          <Text className="font-titulo text-xl text-texto">Punto del servicio</Text>
          <Text className="mb-bloque font-cuerpo text-base text-texto-suave">
            {puntoSeleccionado
              ? `Elegiste ${formatearCoordenadas(puntoSeleccionado)}`
              : 'Aún no has elegido un punto.'}
          </Text>
          <Boton
            texto="Usar este punto"
            icono="check"
            deshabilitado={!puntoSeleccionado}
            // El punto ya está en mapaStore: el formulario lo lee al volver.
            onPress={() => router.back()}
          />
        </View>
      ) : (
        <PanelSeguimiento
          seguimiento={ubicacion.seguimiento}
          ocupado={ubicacion.ocupado}
          onActivar={() => void ubicacion.activarSeguimiento()}
          onPausar={ubicacion.pausarSeguimiento}
          onReanudar={() => void ubicacion.reanudarSeguimiento()}
        />
      )}
    </SafeAreaView>
  );
}
