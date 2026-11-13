import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import AvisoConexion from '../../../../src/components/AvisoConexion';
import BarraBusqueda from '../../../../src/components/BarraBusqueda';
import ChipFiltro from '../../../../src/components/ChipFiltro';
import EstadoVista from '../../../../src/components/EstadoVista';
import FilaChips from '../../../../src/components/FilaChips';
import TarjetaCotizacion from '../../../../src/components/TarjetaCotizacion';
import { COLORES } from '../../../../src/config/colores';
import { useCotizaciones } from '../../../../src/hooks/useCotizaciones';
import { useRetraso } from '../../../../src/hooks/useRetraso';
import {
  esCotizacionPersonal,
  NOMBRE_FILTRO_COTIZACION,
  type CotizacionPersonal,
  type FiltroEstadoCotizacion,
} from '../../../../src/models/Cotizacion';
import { normalizarTexto } from '../../../../src/utils/texto';

/** Espera tras la última letra antes de filtrar por cliente (no se filtra con cada tecla). */
const ESPERA_BUSQUEDA_MS = 400;

/** Chips de estado en el orden de RF-19 (más Vencida, agregada en F5). */
const FILTROS = Object.keys(NOMBRE_FILTRO_COTIZACION) as FiltroEstadoCotizacion[];

/**
 * Cotizaciones del trabajador y del administrador (RF-19): solicitudes y cotizaciones con filtro
 * por estado y búsqueda por nombre del cliente. El estado lo filtra el servidor
 * (useCotizaciones → cotizaciones.service); el nombre del cliente se busca en la app, sin
 * distinguir tildes ("Gomez" encuentra "Gómez"), igual que en Clientes.
 * La protección por rol la hace el _layout del Drawer.
 */
export default function CotizacionesTrabajador() {
  // null = todas. "Enviada" agrupa Nueva y Vista.
  const [estado, setEstado] = useState<FiltroEstadoCotizacion | null>(null);
  // Lo que el usuario escribe (se ve al instante) y lo que se busca (tras una pausa).
  const [busqueda, setBusqueda] = useState('');
  const busquedaEnviada = useRetraso(busqueda, ESPERA_BUSQUEDA_MS).trim();

  const consulta = useCotizaciones(estado ? { estado } : {});

  // El personal siempre recibe cotizaciones con su cliente; esCotizacionPersonal ayuda a TypeScript.
  // Después se dejan las del cliente buscado (sin texto, normalizarTexto da '' y pasan todas).
  const textoCliente = normalizarTexto(busquedaEnviada);
  const cotizaciones: CotizacionPersonal[] = (consulta.data ?? [])
    .filter(esCotizacionPersonal)
    .filter((cotizacion) => normalizarTexto(cotizacion.cliente?.nombre ?? '').includes(textoCliente));
  const hayFiltros = estado !== null || busquedaEnviada !== '';

  function abrirNueva() {
    router.push('/(trabajador)/flujos/cotizacion-form');
  }

  /** Un borrador se continúa en el formulario; las demás abren su detalle. */
  function abrir(cotizacion: CotizacionPersonal) {
    if (cotizacion.estado === 'borrador') {
      router.push({ pathname: '/(trabajador)/flujos/cotizacion-form', params: { id: cotizacion.id } });
    } else {
      router.push({ pathname: '/cotizacion/[id]', params: { id: cotizacion.id } });
    }
  }

  /** Convierte una solicitud en cotización: el formulario precarga sus datos. */
  function crearDesdeSolicitud(cotizacion: CotizacionPersonal) {
    router.push({ pathname: '/(trabajador)/flujos/cotizacion-form', params: { id: cotizacion.id } });
  }

  function limpiarFiltros() {
    setEstado(null);
    setBusqueda('');
  }

  function contenido() {
    if (consulta.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando cotizaciones…" />;
    }

    if (consulta.isError && consulta.data === undefined) {
      return (
        <EstadoVista
          tipo="error"
          mensaje="No se pudieron cargar las cotizaciones"
          detalle={consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />
      );
    }

    if (cotizaciones.length === 0) {
      return hayFiltros ? (
        <EstadoVista
          tipo="vacio"
          mensaje="No hay cotizaciones que coincidan"
          detalle="Prueba con otro estado o con otro nombre de cliente."
          accion={{ texto: 'Limpiar filtros', onPress: limpiarFiltros }}
        />
      ) : (
        <EstadoVista
          tipo="vacio"
          mensaje="Aún no hay solicitudes ni cotizaciones"
          accion={{ texto: 'Nueva cotización', onPress: abrirNueva }}
        />
      );
    }

    return (
      <FlatList
        data={cotizaciones}
        keyExtractor={(cotizacion) => cotizacion.id}
        renderItem={({ item }) => (
          <TarjetaCotizacion
            cotizacion={item}
            onPress={() => abrir(item)}
            onCrearCotizacion={() => crearDesdeSolicitud(item)}
          />
        )}
        contentContainerClassName="px-pantalla pb-seccion"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={consulta.isRefetching}
            onRefresh={() => {
              void consulta.refetch();
            }}
            colors={[COLORES.primario]}
          />
        }
      />
    );
  }

  return (
    // SafeAreaView solo agrega el espacio que tapa el sistema: arriba ya está el encabezado del Drawer.
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="px-pantalla pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-titulo text-3xl text-texto">Cotizaciones</Text>
          <Pressable
            onPress={abrirNueva}
            accessibilityRole="button"
            accessibilityLabel="Nueva cotización"
            className="h-11 flex-row items-center rounded-boton bg-primario px-4 active:opacity-80"
          >
            <Feather name="plus" size={18} color={COLORES.fondo} style={{ marginRight: 6 }} />
            <Text className="font-cuerpo-semi text-base text-fondo">Nueva</Text>
          </Pressable>
        </View>

        <View className="my-bloque">
          <BarraBusqueda valor={busqueda} onChangeText={setBusqueda} placeholder="Buscar por cliente" />
        </View>
      </View>

      <FilaChips etiquetaAccesible="Filtrar por estado" className="pb-bloque">
        <ChipFiltro etiqueta="Todas" activo={estado === null} onPress={() => setEstado(null)} />
        {FILTROS.map((filtro) => (
          <ChipFiltro
            key={filtro}
            etiqueta={NOMBRE_FILTRO_COTIZACION[filtro]}
            activo={estado === filtro}
            onPress={() => setEstado(filtro)}
          />
        ))}
      </FilaChips>

      {consulta.mostrandoCache ? (
        <View className="px-pantalla">
          <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
        </View>
      ) : null}

      {contenido()}
    </SafeAreaView>
  );
}
