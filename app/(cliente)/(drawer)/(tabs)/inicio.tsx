import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import AvisoConexion from '../../../../src/components/AvisoConexion';
import { EtiquetaTipoServicio } from '../../../../src/components/EtiquetasCita';
import TarjetaResumenInicio from '../../../../src/components/TarjetaResumenInicio';
import { COLORES } from '../../../../src/config/colores';
import { useCitasCliente } from '../../../../src/hooks/useCitas';
import { useCotizaciones } from '../../../../src/hooks/useCotizaciones';
import { useRecargarAlVolver } from '../../../../src/hooks/useRecargarAlVolver';
import { useSesionStore } from '../../../../src/store/sesionStore';
import type { BotonInicioProps } from '../../../../src/types/props.types';
import { formatearFechaCita, proximaCita } from '../../../../src/utils/citas';

/**
 * Inicio del cliente (sección 6): saludo, accesos rápidos (Solicitar cotización, Agendar cita y
 * Catálogo), el número de cotizaciones nuevas (enviadas y sin abrir) y la próxima cita Programada.
 * Los datos salen de las mismas consultas de la bandeja y de Mis citas (TanStack Query), así que
 * comparten la caché. Se recarga al deslizar y al volver a la pestaña.
 */
export default function InicioCliente() {
  const nombre = useSesionStore((estado) => estado.usuario?.nombre ?? '');
  const primerNombre = nombre.trim().split(' ')[0] ?? '';

  const cotizaciones = useCotizaciones();
  const citas = useCitasCliente();

  // useCallback: la función debe ser la misma en cada render, porque useRecargarAlVolver la usa
  // como dependencia de useFocusEffect (si cambiara, recargaría en cada render).
  const refetchCotizaciones = cotizaciones.refetch;
  const refetchCitas = citas.refetch;
  const recargar = useCallback(() => {
    void refetchCotizaciones();
    void refetchCitas();
  }, [refetchCotizaciones, refetchCitas]);
  useRecargarAlVolver(recargar);

  // Nuevas: enviadas por el negocio y todavía sin abrir (RF-20). "Por cotizar" no cuenta.
  const nuevas = (cotizaciones.data ?? []).filter((cotizacion) => cotizacion.noLeida && !cotizacion.porCotizar).length;
  const proxima = proximaCita(citas.data ?? []);

  const sinConexion = cotizaciones.mostrandoCache || citas.mostrandoCache;

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView
        contentContainerClassName="px-pantalla pb-seccion pt-2"
        refreshControl={
          <RefreshControl
            refreshing={cotizaciones.isRefetching || citas.isRefetching}
            onRefresh={recargar}
            colors={[COLORES.primario]}
          />
        }
      >
        <Text className="font-titulo text-3xl text-texto" accessibilityRole="header">
          {primerNombre ? `Hola, ${primerNombre}` : 'Hola'}
        </Text>
        <Text className="mb-seccion font-cuerpo text-base text-texto-suave">¿Qué necesitas hoy?</Text>

        {sinConexion ? <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." /> : null}

        {/* Accesos rápidos (mockup de Inicio). */}
        <BotonInicio
          texto="Solicitar cotización"
          icono="clipboard"
          principal
          onPress={() => router.push('/(cliente)/flujos/solicitar-cotizacion')}
        />
        <BotonInicio
          texto="Agendar cita"
          icono="calendar"
          onPress={() => router.push('/(cliente)/flujos/agendar-cita')}
        />
        <BotonInicio
          texto="Ver catálogo"
          icono="grid"
          onPress={() => router.navigate('/(cliente)/(drawer)/(tabs)/catalogo')}
        />

        <Text className="mb-bloque mt-seccion font-titulo text-xl text-texto">Tu resumen</Text>

        <TarjetaResumenInicio
          titulo="Cotizaciones nuevas"
          icono="file-text"
          cargando={cotizaciones.isPending}
          error={
            cotizaciones.isError && cotizaciones.data === undefined
              ? `No se pudieron cargar tus cotizaciones. ${cotizaciones.error.mensaje}`
              : null
          }
          onReintentar={() => cotizaciones.refetch()}
          onPress={() => router.navigate('/(cliente)/(drawer)/(tabs)/cotizaciones')}
        >
          <Text className="font-titulo text-3xl text-primario">{nuevas}</Text>
          <Text className="font-cuerpo text-base text-texto-suave">
            {nuevas === 0
              ? 'No tienes cotizaciones sin abrir.'
              : nuevas === 1
                ? 'Tienes 1 cotización sin abrir.'
                : `Tienes ${nuevas} cotizaciones sin abrir.`}
          </Text>
        </TarjetaResumenInicio>

        <TarjetaResumenInicio
          titulo="Próxima cita"
          icono="calendar"
          cargando={citas.isPending}
          error={
            citas.isError && citas.data === undefined
              ? `No se pudieron cargar tus citas. ${citas.error.mensaje}`
              : null
          }
          onReintentar={() => citas.refetch()}
          onPress={() => router.navigate('/(cliente)/(drawer)/mis-citas')}
        >
          {proxima ? (
            <View>
              <EtiquetaTipoServicio tipo={proxima.tipo} />
              <Text className="mt-2 font-cuerpo-semi text-base text-texto">
                {formatearFechaCita(proxima.fecha)} · {proxima.franjaTexto}
              </Text>
              {proxima.direccion ? (
                <Text className="font-cuerpo text-base text-texto-suave" numberOfLines={2}>
                  {proxima.direccion}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text className="font-cuerpo text-base text-texto-suave">No tienes citas programadas.</Text>
          )}
        </TarjetaResumenInicio>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Botón grande de acceso rápido con ícono y flecha (mockup de Inicio). */
function BotonInicio({ texto, icono, principal = false, onPress }: BotonInicioProps) {
  const colorIcono = principal ? COLORES.fondo : COLORES.secundario;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`mb-bloque h-16 flex-row items-center rounded-tarjeta px-4 active:opacity-80 ${
        principal ? 'bg-primario' : 'border border-secundario bg-fondo'
      }`}
    >
      <Feather name={icono} size={24} color={colorIcono} style={{ marginRight: 14 }} />
      <Text className={`flex-1 font-titulo-semi text-lg ${principal ? 'text-fondo' : 'text-texto'}`}>{texto}</Text>
      <Feather name="chevron-right" size={22} color={colorIcono} />
    </Pressable>
  );
}
