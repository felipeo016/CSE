import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import AvisoConexion from '../../../../src/components/AvisoConexion';
import EstadoVista from '../../../../src/components/EstadoVista';
import GraficaVentas from '../../../../src/components/GraficaVentas';
import TarjetasResumenPanel from '../../../../src/components/TarjetasResumenPanel';
import ResumenTotalesVentas from '../../../../src/components/ResumenTotalesVentas';
import RutaProtegida from '../../../../src/components/RutaProtegida';
import SelectorMes from '../../../../src/components/SelectorMes';
import TarjetaVentaProducto from '../../../../src/components/TarjetaVentaProducto';
import { COLORES } from '../../../../src/config/colores';
import { useVentasDelMes } from '../../../../src/hooks/useVentas';
import { ROLES_ADMINISTRADOR } from '../../../../src/utils/navegacion';
import { mesDe, nombreMes } from '../../../../src/utils/ventas';

/**
 * Panel general: ventas y ganancias por producto y periodo (RF-35). Pestaña solo del
 * administrador; un trabajador que abra la ruta ve "Acceso no autorizado". Además, la RPC
 * ventas_y_ganancias solo le responde al administrador (RNF-06).
 */
export default function PanelGeneral() {
  return (
    <RutaProtegida roles={ROLES_ADMINISTRADOR}>
      <ContenidoPanel />
    </RutaProtegida>
  );
}

function ContenidoPanel() {
  // Periodo por mes; por defecto el mes actual.
  const [mes, setMes] = useState(mesDe());
  const consulta = useVentasDelMes(mes);
  const clienteQuery = useQueryClient();

  function contenido() {
    if (consulta.isPending) {
      return <EstadoVista tipo="carga" mensaje="Cargando ventas…" />;
    }
    if (consulta.isError && consulta.data === undefined) {
      return (
        <EstadoVista
          tipo="error"
          mensaje="No se pudieron cargar las ventas"
          detalle={consulta.error.mensaje}
          accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
        />
      );
    }

    const { productos, totales } = consulta.data;
    return (
      <View>
        {/* Totales arriba: en un periodo sin ventas se ven en cero (RF-35). */}
        <ResumenTotalesVentas totales={totales} />

        {/* Gráfica de barras del mockup, una barra por producto vendido. */}
        {productos.length > 0 ? (
          <View className="mb-bloque rounded-tarjeta border border-borde bg-fondo p-4">
            <Text className="mb-3 font-cuerpo-semi text-base text-texto">Ventas por producto</Text>
            <GraficaVentas productos={productos} />
            <Text className="mt-2 font-cuerpo text-xs text-texto-suave">
              {productos.length > 10
                ? 'Los 10 productos con más ventas. El número es su posición en la lista de abajo.'
                : 'El número de cada barra es su posición en la lista de abajo.'}
            </Text>
          </View>
        ) : null}

        <Text className="mb-2 mt-bloque font-titulo-semi text-xl text-texto">Por producto</Text>
        {productos.length === 0 ? (
          <View className="rounded-tarjeta border border-borde bg-fondo">
            <EstadoVista
              tipo="vacio"
              mensaje="Sin ventas en este periodo"
              detalle={`No hay pedidos registrados en ${nombreMes(mes)}. Elige otro mes con las flechas.`}
            />
          </View>
        ) : (
          productos.map((venta) => <TarjetaVentaProducto key={venta.productoId} venta={venta} />)
        )}

        <Text className="mt-2 font-cuerpo text-sm text-texto-suave">
          Ganancia = (precio de venta − costo al momento de la venta) × unidades. No incluye el
          servicio de instalación o mantenimiento ni reparte descuentos por producto.
        </Text>
      </View>
    );
  }

  return (
    // Arriba ya está el encabezado del Drawer: solo se protegen los lados (abajo están las pestañas).
    <SafeAreaView className="flex-1 bg-fondo" edges={['left', 'right']}>
      <ScrollView
        contentContainerClassName="flex-grow px-pantalla pb-seccion pt-4"
        refreshControl={
          <RefreshControl
            refreshing={consulta.isRefetching}
            onRefresh={() => {
              void consulta.refetch();
              // También las tarjetas de resumen (cada una vuelve a pedir lo suyo).
              void clienteQuery.invalidateQueries({ queryKey: ['pedidos'] });
              void clienteQuery.invalidateQueries({ queryKey: ['cotizaciones'] });
              void clienteQuery.invalidateQueries({ queryKey: ['citas'] });
              void clienteQuery.invalidateQueries({ queryKey: ['productos'] });
            }}
            colors={[COLORES.primario]}
          />
        }
      >
        <Text className="font-titulo text-3xl text-texto">Panel general</Text>
        <Text className="mb-bloque font-cuerpo text-base text-texto-suave">Resumen de {nombreMes(mes)}</Text>

        <SelectorMes mes={mes} onCambiar={setMes} />

        {/* Tarjetas de resumen del mockup: cada una con su carga y su error, sin bloquear el resto. */}
        <View className="mt-bloque">
          <TarjetasResumenPanel mes={mes} />
        </View>

        <View className="my-bloque">
          {consulta.mostrandoCache ? (
            <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
          ) : null}
          {/* Error al recargar con datos en pantalla: se avisa sin tapar lo que ya se ve. */}
          {consulta.isError && consulta.data !== undefined && !consulta.sinConexion ? (
            <Text className="font-cuerpo text-sm text-error">{consulta.error.mensaje}</Text>
          ) : null}
        </View>

        {contenido()}
      </ScrollView>
    </SafeAreaView>
  );
}
