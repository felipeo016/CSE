import { useEffect, useRef } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import AccionesCotizacionCliente from '../../src/components/AccionesCotizacionCliente';
import AvisoConexion from '../../src/components/AvisoConexion';
import Boton from '../../src/components/Boton';
import EstadoVista from '../../src/components/EstadoVista';
import EtiquetaEstadoCotizacion from '../../src/components/EtiquetaEstadoCotizacion';
import RutaProtegida from '../../src/components/RutaProtegida';
import TotalesCotizacion from '../../src/components/TotalesCotizacion';
import { COLORES } from '../../src/config/colores';
import { useCotizacion, useMarcarCotizacionVista } from '../../src/hooks/useCotizaciones';
import { esCotizacionPersonal, TEXTO_POR_COTIZAR } from '../../src/models/Cotizacion';
import { NOMBRE_TIPO_CLIENTE } from '../../src/models/Cliente';
import { useSesionStore } from '../../src/store/sesionStore';
import type {
  AvisoVigenciaProps,
  ContenidoPorIdProps,
  LineaDetalleCotizacionProps,
  PorCotizarProps,
} from '../../src/types/props.types';
import { formatearFecha, formatearPrecio } from '../../src/utils/formato';
import { ROLES_TODOS } from '../../src/utils/navegacion';

/**
 * Detalle de cotización, ruta dinámica /cotizacion/[id] (RF-21, RF-22). La abren todos los roles:
 * - Cliente: líneas y totales sin costo ni ganancia (RNF-06). Al abrir una Nueva pasa a Vista.
 *   En Nueva o Vista puede aceptarla (se crea el pedido) o rechazarla.
 * - Personal: el mismo detalle con el cliente y su estado; un borrador se continúa en el formulario.
 * Un id inexistente o de otro cliente muestra "Cotización no encontrada" (CP-09).
 */
export default function DetalleCotizacion() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RutaProtegida roles={ROLES_TODOS}>
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        <ContenidoDetalle id={id} />
      </SafeAreaView>
    </RutaProtegida>
  );
}

function ContenidoDetalle({ id }: ContenidoPorIdProps) {
  const consulta = useCotizacion(id);
  const rol = useSesionStore((estado) => estado.usuario?.rol);
  const { mutate: marcarVista } = useMarcarCotizacionVista();
  // Id de la cotización que ya se marcó como Vista: así se pide una sola vez por apertura.
  const marcadaRef = useRef<string | null>(null);

  const cotizacion = consulta.data ?? null;

  // Al abrir una cotización Nueva, el cliente la marca como Vista (RF-21). Si falla (por ejemplo,
  // sin conexión) sigue como Nueva y se intenta otra vez la próxima vez que la abra.
  // "Por cotizar" (sin total) no se marca: el cliente todavía no ha visto los precios.
  useEffect(() => {
    if (
      rol === 'cliente' &&
      cotizacion &&
      cotizacion.estado === 'nueva' &&
      !cotizacion.porCotizar &&
      marcadaRef.current !== cotizacion.id
    ) {
      marcadaRef.current = cotizacion.id;
      marcarVista(cotizacion.id);
    }
  }, [rol, cotizacion, marcarVista]);

  function volverACotizaciones() {
    if (rol === 'cliente') {
      router.navigate('/(cliente)/(drawer)/(tabs)/cotizaciones');
    } else {
      router.navigate('/(trabajador)/(drawer)/(tabs)/cotizaciones');
    }
  }

  const noEncontrada = (
    <EstadoVista
      tipo="vacio"
      mensaje="Cotización no encontrada"
      detalle="Puede que el enlace esté mal o que no tengas acceso a esa cotización."
      accion={{ texto: 'Volver a cotizaciones', onPress: volverACotizaciones }}
    />
  );

  // Sin id en la ruta la consulta no se ejecuta: es lo mismo que una cotización inexistente.
  if (!id) {
    return noEncontrada;
  }
  if (consulta.isPending) {
    return <EstadoVista tipo="carga" mensaje="Cargando cotización…" />;
  }
  if (consulta.isError && consulta.data === undefined) {
    return (
      <EstadoVista
        tipo="error"
        mensaje="No se pudo cargar la cotización"
        detalle={consulta.sinConexion ? 'Revisa tu conexión e inténtalo de nuevo' : consulta.error.mensaje}
        accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
      />
    );
  }
  if (!cotizacion) {
    return noEncontrada;
  }

  const personal = esCotizacionPersonal(cotizacion);
  // Líneas y totales solo si el servidor envió el total. El cliente además no los ve en
  // Solicitada ni Borrador (porCotizar); el personal sí ve los del borrador.
  // Se decide con el estado y el total, no con las líneas.
  const mostrarPrecios = personal
    ? cotizacion.estado !== 'solicitada' && cotizacion.totalDisponible
    : !cotizacion.porCotizar;

  return (
    <>
      {/* Título del mockup: "Cotización COT-0042" con la etiqueta del estado a la derecha. */}
      <Stack.Screen
        options={{
          title: `Cotización ${cotizacion.numero}`,
          headerRight: () => (
            <EtiquetaEstadoCotizacion
              estado={cotizacion.estado}
              paraPersonal={personal}
              porCotizar={cotizacion.porCotizar}
            />
          ),
        }}
      />
      <ScrollView
        contentContainerClassName="px-pantalla pb-seccion pt-4"
        refreshControl={
          <RefreshControl
            refreshing={consulta.isRefetching}
            onRefresh={() => {
              void consulta.refetch();
            }}
            colors={[COLORES.primario]}
          />
        }
      >
        {consulta.mostrandoCache ? (
          <AvisoConexion mensaje="Sin conexión. Se muestran los últimos datos guardados." />
        ) : null}

        {/* Solo el personal ve a qué cliente pertenece. */}
        {personal ? (
          <View className="mb-bloque rounded-tarjeta border border-borde bg-fondo p-4">
            <Text className="font-cuerpo text-sm text-texto-suave">Cliente</Text>
            <Text className="font-titulo-semi text-lg text-texto">
              {cotizacion.cliente?.nombre ?? 'Cliente sin nombre'}
            </Text>
            {cotizacion.cliente ? (
              <Text className="font-cuerpo text-sm text-texto-suave">
                {NOMBRE_TIPO_CLIENTE[cotizacion.cliente.tipo]}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View className="mb-bloque">
          <Text className="font-cuerpo text-base text-texto-suave">
            {cotizacion.tipoServicioNombre} · {formatearFecha(cotizacion.creadoEn)}
          </Text>
          {cotizacion.descripcion ? (
            <Text className="mt-1 font-cuerpo text-base text-texto">{cotizacion.descripcion}</Text>
          ) : null}
        </View>

        {mostrarPrecios ? (
          <>
            <View className="mb-bloque rounded-tarjeta border border-borde bg-fondo p-4">
              <Text className="mb-2 font-titulo text-xl text-texto">Productos</Text>
              {cotizacion.lineas.length === 0 ? (
                <Text className="font-cuerpo text-base text-texto-suave">Esta cotización no tiene productos.</Text>
              ) : (
                cotizacion.lineas.map((linea, indice) => (
                  <LineaDetalle key={linea.id} linea={linea} ultima={indice === cotizacion.lineas.length - 1} />
                ))
              )}
            </View>
            <TotalesCotizacion cotizacion={cotizacion} />
          </>
        ) : (
          <PorCotizar
            productos={cotizacion.productosInteres.map((producto) =>
              producto.cantidad === null ? producto.nombre : `${producto.nombre} (${producto.cantidad})`,
            )}
            paraPersonal={personal}
          />
        )}

        {mostrarPrecios ? <AvisoVigencia cotizacion={cotizacion} /> : null}

        {/* Aceptar y rechazar: solo el cliente, solo en Nueva o Vista sin vencer y con total
            (RF-22). puedeResponder ya excluye "Por cotizar"; se repite para que se lea claro. */}
        {!personal && cotizacion.puedeResponder && !cotizacion.porCotizar ? (
          <AccionesCotizacionCliente
            cotizacion={cotizacion}
            onEstadoCambiado={() => {
              void consulta.refetch();
            }}
          />
        ) : null}

        {/* El personal continúa un borrador en el formulario de Crear cotización (F6). */}
        {personal && cotizacion.estado === 'borrador' ? (
          <View className="mt-2">
            <Boton
              texto="Continuar borrador"
              icono="edit-2"
              onPress={() =>
                router.push({ pathname: '/(trabajador)/flujos/cotizacion-form', params: { id: cotizacion.id } })
              }
            />
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

/** Una línea del mockup: nombre, "2 × $ 79.000" y el subtotal a la derecha. */
function LineaDetalle({ linea, ultima }: LineaDetalleCotizacionProps) {
  return (
    <View className={`flex-row items-center py-3 ${ultima ? '' : 'border-b border-borde'}`}>
      <View className="mr-3 flex-1">
        <Text className="font-cuerpo-medio text-base text-texto">{linea.nombre}</Text>
        <Text className="font-cuerpo text-sm text-texto-suave">
          {linea.cantidad} × {formatearPrecio(linea.precioUnitario)}
          {linea.codigo ? ` · Cód. ${linea.codigo}` : ''}
        </Text>
      </View>
      <Text className="font-cuerpo-semi text-base text-texto">{formatearPrecio(linea.subtotal)}</Text>
    </View>
  );
}

/**
 * Solicitud que aún no tiene precios enviados: se muestran los productos de interés que indicó
 * el cliente (RF-15) y, al cliente, que está "Por cotizar".
 */
function PorCotizar({ productos, paraPersonal }: PorCotizarProps) {
  return (
    <View className="mb-bloque rounded-tarjeta border border-borde bg-fondo p-4">
      {paraPersonal ? null : (
        <View className="mb-2 flex-row items-center">
          <Feather name="clock" size={18} color={COLORES.secundario} style={{ marginRight: 8 }} />
          <Text className="flex-1 font-titulo-semi text-lg text-texto">{TEXTO_POR_COTIZAR}</Text>
        </View>
      )}
      <Text className="font-cuerpo text-base text-texto-suave">
        {paraPersonal
          ? 'Solicitud del cliente, todavía sin cotizar.'
          : 'El negocio está preparando tu cotización. Te llegará a esta bandeja con los precios.'}
      </Text>
      {productos.length > 0 ? (
        <View className="mt-bloque">
          <Text className="font-cuerpo-semi text-base text-texto">Productos de interés</Text>
          {productos.map((producto) => (
            <Text key={producto} className="font-cuerpo text-base text-texto">
              • {producto}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Aviso de vigencia del mockup ("Vence el 18 nov 2026"), según el estado. */
function AvisoVigencia({ cotizacion }: AvisoVigenciaProps) {
  if (!cotizacion.venceEn) {
    return null;
  }
  const fecha = formatearFecha(cotizacion.venceEn);
  const vigente = cotizacion.estado === 'nueva' || cotizacion.estado === 'vista';

  let texto = `Vigente hasta el ${fecha}`;
  if (vigente) {
    texto = `Vence el ${fecha}`;
  } else if (cotizacion.estado === 'vencida') {
    texto = `Venció el ${fecha}. Ya no se puede aceptar.`;
  }

  return (
    <View
      className={`mb-bloque flex-row items-center rounded-campo border px-4 py-3 ${
        vigente ? 'border-advertencia/40 bg-advertencia/15' : 'border-borde bg-superficie'
      }`}
    >
      <Feather
        name="clock"
        size={20}
        color={vigente ? COLORES.advertencia : COLORES.textoSuave}
        style={{ marginRight: 10 }}
      />
      <Text className="flex-1 font-cuerpo-medio text-base text-texto">{texto}</Text>
    </View>
  );
}
