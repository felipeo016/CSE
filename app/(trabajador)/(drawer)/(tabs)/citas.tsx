import { useMemo, useState, type ReactNode } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AvisoConexion from '../../../../src/components/AvisoConexion';
import ChipFiltro from '../../../../src/components/ChipFiltro';
import EstadoVista from '../../../../src/components/EstadoVista';
import TarjetaCita from '../../../../src/components/TarjetaCita';
import { COLORES } from '../../../../src/config/colores';
import { useCambiarEstadoCita, useTodasLasCitas } from '../../../../src/hooks/useCitas';
import { useRecargarAlVolver } from '../../../../src/hooks/useRecargarAlVolver';
import {
  NOMBRE_ESTADO_CITA,
  type Cita,
  type EstadoFinalCita,
  type FiltroEstadoCita,
} from '../../../../src/models/Cita';
import { formatearFechaCita, ordenarCitas } from '../../../../src/utils/citas';

/** Filtros por estado, en el orden en que se muestran los chips. */
const FILTROS: { valor: FiltroEstadoCita; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'programada', etiqueta: 'Programadas' },
  { valor: 'realizada', etiqueta: 'Realizadas' },
  { valor: 'cancelada', etiqueta: 'Canceladas' },
];

const MENSAJE_SIN_CONEXION = 'Sin conexión. El estado de la cita no cambió. Revisa tu conexión y pulsa Reintentar.';

/**
 * Citas del trabajador y del administrador (RF-28): todas las citas, con las Programadas primero y
 * filtro por estado. Una cita Programada se pasa a Realizada o Cancelada con confirmación; el
 * cambio solo se muestra con la respuesta del servidor y el cliente lo ve al recargar Mis citas.
 * El filtro se aplica en la app sobre la lista ya cargada (una sola consulta).
 */
export default function CitasTrabajador() {
  const consulta = useTodasLasCitas();
  const cambiar = useCambiarEstadoCita();
  const [filtro, setFiltro] = useState<FiltroEstadoCita>('todas');
  useRecargarAlVolver(consulta.refetch);

  const citas = useMemo(() => {
    const ordenadas = ordenarCitas(consulta.data ?? []);
    return filtro === 'todas' ? ordenadas : ordenadas.filter((cita) => cita.estado === filtro);
  }, [consulta.data, filtro]);

  // Id de la cita que se está guardando: bloquea sus botones (sin doble envío).
  const citaEnCambio = cambiar.isPending ? cambiar.variables?.id : undefined;

  function guardarEstado(cita: Cita, estado: EstadoFinalCita) {
    if (cambiar.isPending) {
      return;
    }
    // Sin conexión la mutación falla enseguida con "sin_conexion" (networkMode 'always'): el
    // estado no cambia y se ofrece Reintentar (RNF-08). No se revisa aquí la conexión guardada
    // en el render, porque Reintentar usaría ese valor viejo aunque la red ya hubiera vuelto.
    cambiar.mutate(
      { id: cita.id, estado },
      {
        onSuccess: (guardada) =>
          Alert.alert('Cita actualizada', `La cita quedó ${guardada.estadoNombre}.`),
        onError: (error) =>
          mostrarError(cita, estado, error.tipo === 'sin_conexion' ? MENSAJE_SIN_CONEXION : error.mensaje),
      },
    );
  }

  function mostrarError(cita: Cita, estado: EstadoFinalCita, mensaje: string) {
    Alert.alert('No se pudo cambiar el estado', mensaje, [
      { text: 'Cerrar', style: 'cancel' },
      { text: 'Reintentar', onPress: () => guardarEstado(cita, estado) },
    ]);
  }

  function confirmarCambio(cita: Cita, estado: EstadoFinalCita) {
    const cliente = cita.clienteNombre ?? 'el cliente';
    const cuando = `${formatearFechaCita(cita.fecha)}, ${cita.franjaTexto}`;
    Alert.alert(
      estado === 'realizada' ? 'Marcar como realizada' : 'Cancelar cita',
      `La cita de ${cliente} (${cuando}) pasará a ${NOMBRE_ESTADO_CITA[estado]}. Después no se puede cambiar. ¿Quieres continuar?`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: estado === 'realizada' ? 'Marcar realizada' : 'Cancelar cita',
          style: estado === 'cancelada' ? 'destructive' : 'default',
          onPress: () => guardarEstado(cita, estado),
        },
      ],
    );
  }

  const controlRecarga = (
    <RefreshControl
      refreshing={consulta.isRefetching}
      onRefresh={() => {
        void consulta.refetch();
      }}
      colors={[COLORES.primario]}
    />
  );

  function recargable(vista: ReactNode) {
    return (
      <ScrollView contentContainerClassName="flex-grow" refreshControl={controlRecarga}>
        {vista}
      </ScrollView>
    );
  }

  function contenido() {
    if (consulta.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando citas…" />;
    }
    if (consulta.isError && consulta.data === undefined) {
      return recargable(
        <EstadoVista
          tipo="error"
          mensaje="No se pudieron cargar las citas"
          detalle={consulta.sinConexion ? 'Revisa tu conexión e inténtalo de nuevo' : consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />,
      );
    }
    if (citas.length === 0) {
      return recargable(
        <EstadoVista
          tipo="vacio"
          mensaje={filtro === 'todas' ? 'No hay citas agendadas' : 'No hay citas con este estado'}
          detalle={
            filtro === 'todas'
              ? 'Las citas que agenden los clientes aparecerán aquí.'
              : 'Prueba con otro filtro.'
          }
          accion={filtro === 'todas' ? undefined : { texto: 'Ver todas', onPress: () => setFiltro('todas') }}
        />,
      );
    }
    return (
      <FlatList
        data={citas}
        keyExtractor={(cita) => cita.id}
        renderItem={({ item }) => (
          <TarjetaCita
            cita={item}
            paraPersonal
            onCambiarEstado={(estado) => confirmarCambio(item, estado)}
            cambiando={citaEnCambio === item.id}
          />
        )}
        contentContainerClassName="px-pantalla pb-seccion"
        refreshControl={controlRecarga}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <View className="px-pantalla pt-4">
        <Text className="font-titulo text-3xl text-texto">Citas</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="my-bloque flex-grow-0"
          accessibilityRole="tablist"
        >
          {FILTROS.map((opcion) => (
            <ChipFiltro
              key={opcion.valor}
              etiqueta={opcion.etiqueta}
              activo={filtro === opcion.valor}
              onPress={() => setFiltro(opcion.valor)}
            />
          ))}
        </ScrollView>
        {consulta.mostrandoCache ? (
          <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
        ) : null}
      </View>
      {contenido()}
    </SafeAreaView>
  );
}
