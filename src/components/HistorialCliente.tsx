import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import EstadoVista from './EstadoVista';
import TarjetaCita from './TarjetaCita';
import TarjetaCotizacion from './TarjetaCotizacion';
import TarjetaPedido from './TarjetaPedido';
import TarjetaUbicacion from './TarjetaUbicacion';
import { useCitasDeCliente } from '../hooks/useCitas';
import { useCotizaciones } from '../hooks/useCotizaciones';
import { usePedidosDeCliente } from '../hooks/usePedidos';
import { useUbicacionesCliente } from '../hooks/useUbicaciones';
import type { CotizacionSegunRol } from '../models/Cotizacion';
import type { Ubicacion } from '../models/Ubicacion';
import type { HistorialClienteProps, SeccionHistorialProps } from '../types/props.types';
import { ordenarCitas } from '../utils/citas';
import type { ConsultaConConexion } from '../utils/consultas';

/** Título de sección del mockup ("Ubicaciones", "Cotizaciones") y su contenido. */
function SeccionHistorial({ titulo, children }: SeccionHistorialProps) {
  return (
    <View className="mt-seccion">
      <Text className="mb-2 font-titulo-semi text-xl text-texto">{titulo}</Text>
      {children}
    </View>
  );
}

/**
 * Carga, error con Reintentar o vacío de una lista del historial (cada lista tiene el suyo: si
 * falla una, las demás se siguen viendo). Devuelve null cuando hay datos para mostrar.
 */
function estadoDeLista<T>(
  consulta: ConsultaConConexion<T[]>,
  textos: { carga: string; error: string; vacio: string },
): ReactNode {
  const enCaja = (contenido: ReactNode) => (
    <View className="rounded-tarjeta border border-borde bg-fondo">{contenido}</View>
  );
  if (consulta.isPending) {
    return enCaja(<EstadoVista tipo="carga" mensaje={textos.carga} />);
  }
  if (consulta.isError && consulta.data === undefined) {
    return enCaja(
      <EstadoVista
        tipo="error"
        mensaje={textos.error}
        detalle={consulta.error.mensaje}
        accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
      />,
    );
  }
  if ((consulta.data ?? []).length === 0) {
    return enCaja(<EstadoVista tipo="vacio" mensaje={textos.vacio} />);
  }
  return null;
}

/**
 * Ubicaciones e historial de cotizaciones, pedidos y citas de UN cliente (RF-33: "el historial
 * muestra solo los registros de ese cliente"). Cada lista filtra por cliente_id en el servidor y
 * reutiliza los servicios de J4, F5/F6 y J6.
 */
export default function HistorialCliente({ clienteId }: HistorialClienteProps) {
  const ubicaciones = useUbicacionesCliente(clienteId);
  const cotizaciones = useCotizaciones({ clienteId });
  const pedidos = usePedidosDeCliente(clienteId);
  const citas = useCitasDeCliente(clienteId);

  function verEnMapa(ubicacion: Ubicacion) {
    router.push({
      pathname: '/(cliente)/flujos/mapa',
      params: {
        modo: 'negocio',
        latitud: String(ubicacion.coordenadas.latitud),
        longitud: String(ubicacion.coordenadas.longitud),
      },
    });
  }

  /** Igual que en Cotizaciones del trabajador: un borrador sigue en el formulario; las demás, al detalle. */
  function abrirCotizacion(cotizacion: CotizacionSegunRol) {
    if (cotizacion.estado === 'borrador') {
      router.push({ pathname: '/(trabajador)/flujos/cotizacion-form', params: { id: cotizacion.id } });
    } else {
      router.push({ pathname: '/cotizacion/[id]', params: { id: cotizacion.id } });
    }
  }

  return (
    <View>
      <SeccionHistorial titulo="Ubicaciones">
        {estadoDeLista(ubicaciones, {
          carga: 'Cargando ubicaciones…',
          error: 'No se pudieron cargar las ubicaciones',
          vacio: 'Sin ubicaciones registradas',
        }) ??
          (ubicaciones.data ?? []).map((ubicacion) => (
            <TarjetaUbicacion key={ubicacion.id} ubicacion={ubicacion} onPress={() => verEnMapa(ubicacion)} />
          ))}
      </SeccionHistorial>

      <SeccionHistorial titulo="Cotizaciones">
        {estadoDeLista(cotizaciones, {
          carga: 'Cargando cotizaciones…',
          error: 'No se pudieron cargar las cotizaciones',
          vacio: 'Sin cotizaciones',
        }) ??
          (cotizaciones.data ?? []).map((cotizacion) => (
            <TarjetaCotizacion
              key={cotizacion.id}
              cotizacion={cotizacion}
              onPress={() => abrirCotizacion(cotizacion)}
            />
          ))}
      </SeccionHistorial>

      <SeccionHistorial titulo="Pedidos">
        {estadoDeLista(pedidos, {
          carga: 'Cargando pedidos…',
          error: 'No se pudieron cargar los pedidos',
          vacio: 'Sin pedidos',
        }) ?? (pedidos.data ?? []).map((pedido) => <TarjetaPedido key={pedido.id} pedido={pedido} />)}
      </SeccionHistorial>

      <SeccionHistorial titulo="Citas">
        {estadoDeLista(citas, {
          carga: 'Cargando citas…',
          error: 'No se pudieron cargar las citas',
          vacio: 'Sin citas',
        }) ?? ordenarCitas(citas.data ?? []).map((cita) => <TarjetaCita key={cita.id} cita={cita} />)}
      </SeccionHistorial>
    </View>
  );
}
