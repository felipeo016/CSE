import { View } from 'react-native';
import { router } from 'expo-router';

import TarjetaIndicador from './TarjetaIndicador';
import { COLORES } from '../config/colores';
import { useTodasLasCitas } from '../hooks/useCitas';
import { useCotizaciones } from '../hooks/useCotizaciones';
import { usePedidosDelMes } from '../hooks/usePedidos';
import { useProductos } from '../hooks/useProductos';
import type { TarjetasResumenPanelProps } from '../types/props.types';
import type { ConsultaConConexion } from '../utils/consultas';
import { contarCitasDeLaSemana, contarCotizacionesPendientes, contarStockBajo } from '../utils/panel';

/**
 * Datos comunes de una tarjeta a partir de su consulta: valor, carga y error. Si hay datos en
 * caché (por ejemplo sin conexión), se muestra el valor guardado en lugar del error.
 */
function estadoTarjeta<T>(consulta: ConsultaConConexion<T>, calcular: (datos: T) => number) {
  return {
    valor: consulta.data !== undefined ? calcular(consulta.data) : null,
    cargando: consulta.isPending && consulta.fetchStatus !== 'idle',
    error: consulta.data === undefined && consulta.isError ? consulta.error.mensaje : null,
    onReintentar: () => {
      void consulta.refetch();
    },
  };
}

/**
 * Las cuatro tarjetas de resumen del mockup del Panel general. Cada una usa una consulta distinta
 * y tiene su propia carga y su propio error: si una falla, las demás y las ventas se siguen viendo.
 * Reutiliza los hooks de Cotizaciones (F6), Citas (J6) y Productos (J7); solo "Pedidos del mes" es
 * una consulta nueva, de personal. Pedidos del mes sigue el mes elegido; las otras tres muestran
 * el estado de hoy.
 */
export default function TarjetasResumenPanel({ mes }: TarjetasResumenPanelProps) {
  const pedidos = usePedidosDelMes(mes);
  const cotizaciones = useCotizaciones({});
  const citas = useTodasLasCitas();
  const productos = useProductos();

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        {/* No hay lista de pedidos para el personal: esta tarjeta no se puede tocar. */}
        <TarjetaIndicador
          icono="shopping-bag"
          color={COLORES.primario}
          etiqueta="Pedidos del mes"
          {...estadoTarjeta(pedidos, (cantidad) => cantidad)}
        />
        <TarjetaIndicador
          icono="file-text"
          color={COLORES.advertencia}
          etiqueta="Cotizaciones pendientes"
          {...estadoTarjeta(cotizaciones, contarCotizacionesPendientes)}
          onPress={() => router.navigate('/(trabajador)/(drawer)/(tabs)/cotizaciones')}
        />
      </View>
      <View className="flex-row gap-3">
        <TarjetaIndicador
          icono="calendar"
          color={COLORES.exito}
          etiqueta="Citas de la semana"
          {...estadoTarjeta(citas, (lista) => contarCitasDeLaSemana(lista))}
          onPress={() => router.navigate('/(trabajador)/(drawer)/(tabs)/citas')}
        />
        <TarjetaIndicador
          icono="alert-octagon"
          color={COLORES.error}
          etiqueta="Productos con stock bajo"
          {...estadoTarjeta(productos, contarStockBajo)}
          onPress={() => router.navigate('/(trabajador)/(drawer)/(tabs)/productos')}
        />
      </View>
    </View>
  );
}
