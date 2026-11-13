import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import AvisoErrorAccion from '../../../src/components/AvisoErrorAccion';
import Boton from '../../../src/components/Boton';
import ChipFiltro from '../../../src/components/ChipFiltro';
import EstadoVista from '../../../src/components/EstadoVista';
import OpcionTarjeta from '../../../src/components/OpcionTarjeta';
import RutaProtegida from '../../../src/components/RutaProtegida';
import SelectorSegmentado from '../../../src/components/SelectorSegmentado';
import { COLORES } from '../../../src/config/colores';
import { useCrearCita } from '../../../src/hooks/useCitas';
import { useEnLinea } from '../../../src/hooks/useEnLinea';
import { usePedidosCliente } from '../../../src/hooks/usePedidos';
import { useUbicacionesCliente } from '../../../src/hooks/useUbicaciones';
import { NOMBRE_TIPO_SERVICIO, type TipoServicio } from '../../../src/models/Cotizacion';
import { useSesionStore } from '../../../src/store/sesionStore';
import type { ErrorApi } from '../../../src/types/api.types';
import type { CitaConfirmadaProps, FilaResumenCitaProps } from '../../../src/types/props.types';
import {
  fechaATexto,
  formatearFechaCita,
  franjaCitaValida,
  OPCIONES_FRANJA,
  textoAFecha,
  textoDiasAtencion,
} from '../../../src/utils/citas';
import { esUuid } from '../../../src/utils/consultas';
import { formatearFecha, formatearPrecio } from '../../../src/utils/formato';
import { ROLES_CLIENTE } from '../../../src/utils/navegacion';
import { fechaCitaValida } from '../../../src/utils/validaciones';

const OPCIONES_SERVICIO = [
  { valor: 'instalacion', etiqueta: NOMBRE_TIPO_SERVICIO.instalacion },
  { valor: 'mantenimiento', etiqueta: NOMBRE_TIPO_SERVICIO.mantenimiento },
] as const;

const RUTA_REGISTRAR_UBICACION = '/(trabajador)/flujos/ubicacion-form';
const RUTA_MIS_CITAS = '/(cliente)/(drawer)/mis-citas';
const RUTA_INICIO = '/(cliente)/(drawer)/(tabs)/inicio';

/** Mensaje por campo (RF-27); null = el campo está bien. */
interface ErroresCita {
  tipo: string | null;
  fecha: string | null;
  franja: string | null;
  ubicacion: string | null;
}

const SIN_ERRORES: ErroresCita = { tipo: null, fecha: null, franja: null, ubicacion: null };

/** Error del envío, ya listo para mostrar. */
interface ErrorEnvio {
  titulo: string;
  mensaje: string;
  sinConexion: boolean;
  reintentable: boolean;
}

const ERROR_SIN_CONEXION: ErrorEnvio = {
  titulo: 'Sin conexión',
  mensaje: 'Tu cita no se agendó. Revisa tu conexión y pulsa Reintentar.',
  sinConexion: true,
  reintentable: true,
};

/**
 * Agendar cita (RF-27), flujo Stack del cliente: tipo de servicio, fecha (selector de fecha),
 * franja horaria, ubicación registrada y, para instalación, el pedido asociado (opcional).
 * - Si llega pedidoId (desde la Confirmación de pedido o el Detalle de pedido), viene preseleccionado.
 * - Se rechazan fechas pasadas, días sin atención, franjas de hoy que ya empezaron, campos vacíos
 *   y citas sin ubicación.
 * - La cita queda Programada solo con la respuesta del servidor (RNF-08).
 * Días y franjas: src/config/valoresPrueba.ts (valores de prueba).
 */
export default function AgendarCita() {
  return (
    <RutaProtegida roles={ROLES_CLIENTE}>
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        <FormularioCita />
      </SafeAreaView>
    </RutaProtegida>
  );
}

function FormularioCita() {
  const parametros = useLocalSearchParams<{ pedidoId?: string }>();
  // Solo se preselecciona un id con formato válido; el servidor además valida que sea del cliente.
  const pedidoInicial = parametros.pedidoId && esUuid(parametros.pedidoId) ? parametros.pedidoId : null;

  const clienteId = useSesionStore((estado) => estado.usuario?.clienteId ?? null);
  const ubicaciones = useUbicacionesCliente(clienteId);
  const pedidos = usePedidosCliente();
  const crear = useCrearCita();
  const enLinea = useEnLinea();

  // Con un pedido preseleccionado la cita es de instalación (sección 5).
  const [tipo, setTipo] = useState<TipoServicio | null>(pedidoInicial ? 'instalacion' : null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [franja, setFranja] = useState<string | null>(null);
  const [ubicacionId, setUbicacionId] = useState<string | null>(null);
  const [pedidoId, setPedidoId] = useState<string | null>(pedidoInicial);
  const [errores, setErrores] = useState<ErroresCita>(SIN_ERRORES);
  const [errorEnvio, setErrorEnvio] = useState<ErrorEnvio | null>(null);

  // La confirmación solo aparece cuando el servidor respondió que guardó la cita.
  if (crear.isSuccess) {
    return <CitaConfirmada cita={crear.data} />;
  }

  if (clienteId === null) {
    return <EstadoVista tipo="error" mensaje="Acceso no autorizado" detalle="Tu cuenta no tiene una ficha de cliente." />;
  }

  const listaUbicaciones = ubicaciones.data ?? [];
  const sinUbicaciones = ubicaciones.isSuccess && listaUbicaciones.length === 0;

  /** Quita el error de un campo y el del envío al cambiarlo. */
  function limpiar(campo: keyof ErroresCita) {
    setErrores((anteriores) => ({ ...anteriores, [campo]: null }));
    setErrorEnvio(null);
  }

  function elegirFecha(elegida: Date) {
    setMostrarCalendario(false);
    const texto = fechaATexto(elegida);
    setFecha(texto);
    // Se valida al elegir: una fecha pasada o un día sin atención se avisa enseguida.
    // La franja también se revisa otra vez: una franja que servía para mañana puede haber
    // pasado si la fecha cambia a hoy.
    setErrores((anteriores) => ({
      ...anteriores,
      fecha: fechaCitaValida(texto),
      franja: franjaCitaValida(texto, franja),
    }));
    setErrorEnvio(null);
  }

  function alFallar(error: ErrorApi) {
    if (error.tipo === 'sin_conexion') {
      setErrorEnvio(ERROR_SIN_CONEXION);
      return;
    }
    setErrorEnvio({
      titulo: 'No se pudo agendar la cita',
      mensaje: error.mensaje,
      sinConexion: false,
      reintentable: error.tipo === 'servidor',
    });
  }

  function agendar() {
    if (crear.isPending) {
      return; // sin doble envío (el botón además queda bloqueado mientras carga)
    }

    const nuevos: ErroresCita = {
      tipo: tipo === null ? 'Elige el tipo de servicio' : null,
      fecha: fechaCitaValida(fecha),
      // Hoy no se acepta una franja cuya hora de inicio ya pasó (solo lo valida la app).
      franja: franja === null ? 'Elige una franja horaria' : franjaCitaValida(fecha, franja),
      ubicacion:
        ubicacionId !== null
          ? null
          : sinUbicaciones
            ? 'Registra una ubicación para poder agendar la cita'
            : 'Elige la ubicación del servicio',
    };
    setErrores(nuevos);
    if (
      nuevos.tipo || nuevos.fecha || nuevos.franja || nuevos.ubicacion ||
      tipo === null || fecha === null || franja === null || ubicacionId === null || clienteId === null
    ) {
      return;
    }

    // Sin conexión no se intenta: se informa y no se crea nada (RNF-08).
    if (!enLinea) {
      setErrorEnvio(ERROR_SIN_CONEXION);
      return;
    }
    setErrorEnvio(null);

    crear.mutate(
      {
        clienteId,
        tipo,
        fecha,
        franja,
        ubicacionId,
        // El pedido asociado solo aplica a instalación; el mantenimiento no exige compra.
        pedidoId: tipo === 'instalacion' ? pedidoId : null,
      },
      { onError: alFallar },
    );
  }

  function registrarUbicacion() {
    // Al guardar, Registrar ubicación vuelve aquí (router.back) y la lista se actualiza sola.
    router.push(RUTA_REGISTRAR_UBICACION);
  }

  function seccionUbicaciones() {
    if (ubicaciones.isPending) {
      return (
        <View className="flex-row items-center py-3">
          <ActivityIndicator color={COLORES.primario} />
          <Text className="ml-3 font-cuerpo text-base text-texto-suave">Cargando tus ubicaciones…</Text>
        </View>
      );
    }
    if (ubicaciones.isError && ubicaciones.data === undefined) {
      return (
        <View className="py-2">
          <Text className="mb-2 font-cuerpo text-base text-error">
            No se pudieron cargar tus ubicaciones. {ubicaciones.error.mensaje}
          </Text>
          <Boton texto="Reintentar" icono="refresh-cw" variante="secundario" onPress={() => ubicaciones.refetch()} />
        </View>
      );
    }
    if (listaUbicaciones.length === 0) {
      return (
        <View className="rounded-campo border border-borde bg-superficie p-4">
          <Text className="mb-bloque font-cuerpo text-base text-texto">
            Aún no tienes ubicaciones registradas. Registra el lugar del servicio para agendar la cita.
          </Text>
          <Boton texto="Registrar ubicación" icono="map-pin" variante="secundario" onPress={registrarUbicacion} />
        </View>
      );
    }
    return (
      <View>
        {listaUbicaciones.map((ubicacion) => (
          <OpcionTarjeta
            key={ubicacion.id}
            titulo={ubicacion.direccion}
            detalle={ubicacion.referencia}
            icono="map-pin"
            elegida={ubicacionId === ubicacion.id}
            onPress={() => {
              setUbicacionId(ubicacion.id);
              limpiar('ubicacion');
            }}
          />
        ))}
        <Pressable onPress={registrarUbicacion} accessibilityRole="button" className="py-2 active:opacity-70">
          <Text className="font-cuerpo-semi text-base text-primario">+ Registrar otra ubicación</Text>
        </Pressable>
      </View>
    );
  }

  function seccionPedido() {
    const lista = pedidos.data ?? [];
    return (
      <View className="mb-bloque">
        <Text className="mb-2 font-cuerpo-semi text-base text-texto">Pedido asociado (opcional)</Text>
        {pedidos.isPending ? (
          <View className="flex-row items-center py-3">
            <ActivityIndicator color={COLORES.primario} />
            <Text className="ml-3 font-cuerpo text-base text-texto-suave">Cargando tus pedidos…</Text>
          </View>
        ) : pedidos.isError && pedidos.data === undefined ? (
          <View className="py-2">
            <Text className="mb-2 font-cuerpo text-base text-error">
              No se pudieron cargar tus pedidos. {pedidos.error.mensaje}
            </Text>
            <Boton texto="Reintentar" icono="refresh-cw" variante="secundario" onPress={() => pedidos.refetch()} />
          </View>
        ) : (
          <View>
            <OpcionTarjeta
              titulo="Sin pedido"
              icono="minus-circle"
              elegida={pedidoId === null}
              onPress={() => setPedidoId(null)}
            />
            {lista.map((pedido) => (
              <OpcionTarjeta
                key={pedido.id}
                titulo={pedido.numero}
                detalle={`${formatearFecha(pedido.creadoEn)} · ${formatearPrecio(pedido.total)}`}
                icono="shopping-bag"
                elegida={pedidoId === pedido.id}
                onPress={() => setPedidoId(pedido.id)}
              />
            ))}
          </View>
        )}
      </View>
    );
  }

  const fechaElegida = fecha ? textoAFecha(fecha) : null;

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="px-pantalla py-seccion" keyboardShouldPersistTaps="handled">
        <SelectorSegmentado<TipoServicio>
          etiqueta="Tipo de servicio"
          opciones={OPCIONES_SERVICIO}
          valor={tipo}
          onCambiar={(valor) => {
            setTipo(valor);
            limpiar('tipo');
          }}
          error={errores.tipo}
        />

        {/* Fecha: abre el selector de fecha del sistema. */}
        <View className="mb-bloque">
          <Text className="mb-2 font-cuerpo-semi text-base text-texto">Fecha</Text>
          <Pressable
            onPress={() => setMostrarCalendario(true)}
            accessibilityRole="button"
            accessibilityLabel={fecha ? `Fecha, ${formatearFechaCita(fecha)}` : 'Elegir fecha'}
            className={`h-14 flex-row items-center rounded-campo border bg-fondo px-4 active:opacity-80 ${
              errores.fecha ? 'border-error' : 'border-borde'
            }`}
          >
            <Feather name="calendar" size={20} color={COLORES.texto} style={{ marginRight: 12 }} />
            <Text className={`font-cuerpo text-base ${fecha ? 'text-texto' : 'text-texto-suave'}`}>
              {fecha ? formatearFechaCita(fecha) : 'Elige la fecha'}
            </Text>
          </Pressable>
          {errores.fecha ? (
            <Text className="mt-1 font-cuerpo text-sm text-error">{errores.fecha}</Text>
          ) : (
            <Text className="mt-1 font-cuerpo text-sm text-texto-suave">Atención de {textoDiasAtencion()}</Text>
          )}
        </View>
        {mostrarCalendario ? (
          <DateTimePicker
            mode="date"
            value={fechaElegida ?? new Date()}
            onValueChange={(_evento, elegida) => elegirFecha(elegida)}
            onDismiss={() => setMostrarCalendario(false)}
          />
        ) : null}

        {/* Franja horaria (valoresPrueba). */}
        <View className="mb-bloque">
          <Text className="mb-2 font-cuerpo-semi text-base text-texto">Franja horaria</Text>
          <View className="flex-row flex-wrap gap-y-2">
            {OPCIONES_FRANJA.map((opcion) => (
              <ChipFiltro
                key={opcion.valor}
                etiqueta={opcion.etiqueta}
                activo={franja === opcion.valor}
                onPress={() => {
                  setFranja(opcion.valor);
                  limpiar('franja');
                }}
              />
            ))}
          </View>
          {errores.franja ? <Text className="mt-1 font-cuerpo text-sm text-error">{errores.franja}</Text> : null}
        </View>

        {/* Ubicación registrada (obligatoria, sección 5). */}
        <View className="mb-bloque">
          <Text className="mb-2 font-cuerpo-semi text-base text-texto">Ubicación</Text>
          {seccionUbicaciones()}
          {errores.ubicacion ? (
            <Text className="mt-1 font-cuerpo text-sm text-error">{errores.ubicacion}</Text>
          ) : null}
        </View>

        {tipo === 'instalacion' ? seccionPedido() : null}

        {errorEnvio ? (
          <AvisoErrorAccion
            titulo={errorEnvio.titulo}
            mensaje={errorEnvio.mensaje}
            sinConexion={errorEnvio.sinConexion}
            onReintentar={errorEnvio.reintentable ? agendar : undefined}
            reintentando={crear.isPending}
          />
        ) : null}

        <View className="mt-bloque">
          <Boton texto="Agendar" icono="calendar" onPress={agendar} cargando={crear.isPending} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** "¡Cita confirmada!" con el resumen que devolvió el servidor (mockup de Agendar cita). */
function CitaConfirmada({ cita }: CitaConfirmadaProps) {
  return (
    <ScrollView contentContainerClassName="px-pantalla pb-seccion pt-seccion">
      <View className="items-center">
        <View className="h-36 w-36 items-center justify-center rounded-full bg-exito/15">
          <View className="h-28 w-28 items-center justify-center rounded-full bg-exito">
            <Feather name="check" size={64} color={COLORES.fondo} />
          </View>
        </View>
        <Text className="mt-seccion text-center font-titulo text-3xl text-texto" accessibilityRole="header">
          ¡Cita confirmada!
        </Text>
        <Text className="mt-1 text-center font-cuerpo text-base text-texto-suave">
          Tu cita quedó {cita.estadoNombre}
        </Text>
      </View>

      <View className="mt-seccion rounded-tarjeta border border-borde bg-fondo p-4">
        <Text className="mb-2 font-titulo text-xl text-texto">Resumen de la cita</Text>
        <FilaResumenCita icono="tool" etiqueta="Servicio" valor={cita.tipoNombre} />
        <FilaResumenCita icono="calendar" etiqueta="Fecha" valor={formatearFechaCita(cita.fecha)} />
        <FilaResumenCita icono="clock" etiqueta="Horario" valor={cita.franjaTexto} />
        <FilaResumenCita icono="map-pin" etiqueta="Dirección" valor={cita.direccion ?? '—'} />
        {cita.pedidoNumero ? (
          <FilaResumenCita icono="shopping-bag" etiqueta="Pedido" valor={cita.pedidoNumero} />
        ) : null}
      </View>

      <View className="mt-seccion">
        <Boton texto="Ver mis citas" onPress={() => router.navigate(RUTA_MIS_CITAS)} />
        <View className="mt-bloque">
          <Boton texto="Volver al inicio" variante="secundario" onPress={() => router.navigate(RUTA_INICIO)} />
        </View>
      </View>
    </ScrollView>
  );
}

function FilaResumenCita({ icono, etiqueta, valor }: FilaResumenCitaProps) {
  return (
    <View className="flex-row items-center border-b border-borde py-3">
      <Feather name={icono} size={20} color={COLORES.texto} style={{ marginRight: 12 }} />
      <Text className="w-24 font-cuerpo text-base text-texto-suave">{etiqueta}</Text>
      <Text className="flex-1 font-cuerpo-medio text-base text-texto">{valor}</Text>
    </View>
  );
}
