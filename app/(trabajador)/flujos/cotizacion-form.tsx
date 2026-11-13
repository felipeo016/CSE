import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import Boton from '../../../src/components/Boton';
import CampoTexto from '../../../src/components/CampoTexto';
import EstadoVista from '../../../src/components/EstadoVista';
import LineaCotizacionItem from '../../../src/components/LineaCotizacionItem';
import ResumenCotizacion from '../../../src/components/ResumenCotizacion';
import RutaProtegida from '../../../src/components/RutaProtegida';
import SelectorCliente from '../../../src/components/SelectorCliente';
import SelectorProductoCotizacion from '../../../src/components/SelectorProductoCotizacion';
import SelectorSegmentado from '../../../src/components/SelectorSegmentado';
import { COLORES } from '../../../src/config/colores';
import { useCalculoTotal } from '../../../src/hooks/useCalculoTotal';
import {
  useCotizacion,
  useEnviarCotizacion,
  useGuardarBorradorCotizacion,
} from '../../../src/hooks/useCotizaciones';
import { useEnLinea } from '../../../src/hooks/useEnLinea';
import { CLAVE_PARAMETROS, useParametros } from '../../../src/hooks/useParametros';
import { useProductos } from '../../../src/hooks/useProductos';
import type { LineaCalculo } from '../../../src/models/Calculo';
import {
  esCotizacionPersonal,
  NOMBRE_TIPO_SERVICIO,
  type CotizacionGuardada,
  type DatosBorradorCotizacion,
  type TipoServicio,
} from '../../../src/models/Cotizacion';
import type {
  ClienteElegido,
  LineaEnFormulario,
} from '../../../src/models/FormularioCotizacion';
import type { ProductoSegunRol } from '../../../src/models/Producto';
import { esErrorApi, mensajeDeError } from '../../../src/services/api';
import type {
  ConfirmacionEnvioCotizacionProps,
  FormularioCotizacionProps,
} from '../../../src/types/props.types';
import {
  armarLineasVista,
  esEditable,
  formularioValido,
  tarifaComoTexto,
  validarFormulario,
  valoresDesdeCotizacion,
  valoresVacios,
} from '../../../src/utils/cotizacionForm';
import { formatearFecha, formatearPrecio } from '../../../src/utils/formato';
import { ROLES_PERSONAL } from '../../../src/utils/navegacion';

const OPCIONES_SERVICIO = [
  { valor: 'instalacion', etiqueta: NOMBRE_TIPO_SERVICIO.instalacion },
  { valor: 'mantenimiento', etiqueta: NOMBRE_TIPO_SERVICIO.mantenimiento },
] as const;

/** Mensaje de arriba de los botones: éxito (verde) o error (rojo, con Reintentar). */
interface MensajeFormulario {
  tipo: 'exito' | 'error';
  texto: string;
}

/**
 * Crear cotización (RF-16 a RF-18), flujo Stack del trabajador y del administrador.
 * - Sin parámetro: cotización nueva.
 * - Con ?id= de una solicitud: precarga cliente, tipo de servicio y productos de interés.
 * - Con ?id= de un borrador: continúa lo guardado.
 * Una cotización ya enviada no se edita: se muestra el aviso y el acceso a su detalle.
 */
export default function CrearCotizacion() {
  return (
    <RutaProtegida roles={ROLES_PERSONAL}>
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        <CargaCotizacion />
      </SafeAreaView>
    </RutaProtegida>
  );
}

/** Carga lo necesario (inventario y, si hay id, la cotización) antes de mostrar el formulario. */
function CargaCotizacion() {
  const parametrosRuta = useLocalSearchParams<{ id?: string }>();
  const id = typeof parametrosRuta.id === 'string' && parametrosRuta.id !== '' ? parametrosRuta.id : undefined;

  const productos = useProductos();
  const cotizacion = useCotizacion(id);
  // El formulario toma los datos una sola vez al abrirse. Si la copia en caché es vieja (por
  // ejemplo, se acaba de guardar el borrador), se espera la versión del servidor antes de
  // mostrarlo; después, una recarga en segundo plano ya no lo reinicia.
  const formularioMostrado = useRef(false);
  const esperandoDatosFrescos = id !== undefined && cotizacion.isFetching && !formularioMostrado.current;

  if (productos.isPending || (id !== undefined && cotizacion.isPending) || esperandoDatosFrescos) {
    return <EstadoVista tipo="carga" mensaje="Cargando cotización…" />;
  }

  if (productos.isError && productos.data === undefined) {
    return (
      <EstadoVista
        tipo="error"
        mensaje="No se pudo cargar el inventario"
        detalle={productos.error.mensaje}
        accion={{ texto: 'Reintentar', onPress: () => productos.refetch() }}
      />
    );
  }

  // Cotización nueva: formulario vacío.
  if (id === undefined) {
    return <FormularioCotizacion key="nueva" inicial={valoresVacios()} />;
  }

  if (cotizacion.isError && cotizacion.data === undefined) {
    return (
      <EstadoVista
        tipo="error"
        mensaje="No se pudo cargar la cotización"
        detalle={cotizacion.error.mensaje}
        accion={{ texto: 'Reintentar', onPress: () => cotizacion.refetch() }}
      />
    );
  }

  const datos = cotizacion.data;
  if (!datos || !esCotizacionPersonal(datos)) {
    return (
      <EstadoVista
        tipo="vacio"
        mensaje="Cotización no encontrada"
        accion={{ texto: 'Volver', onPress: () => router.back() }}
      />
    );
  }

  // Una cotización enviada ya no se edita (decisión del equipo, RF-18).
  if (!esEditable(datos)) {
    return (
      <EstadoVista
        tipo="vacio"
        mensaje="Esta cotización ya fue enviada"
        detalle={`${datos.numero} ya no se puede editar.`}
        accion={{
          texto: 'Ver detalle',
          onPress: () => router.replace({ pathname: '/cotizacion/[id]', params: { id: datos.id } }),
        }}
      />
    );
  }

  const productosPorId = new Map((productos.data ?? []).map((producto) => [producto.id, producto]));
  formularioMostrado.current = true;
  // key: si cambia el id de la ruta, el formulario arranca de nuevo con los datos de esa cotización.
  return <FormularioCotizacion key={datos.id} inicial={valoresDesdeCotizacion(datos, productosPorId)} />;
}

function FormularioCotizacion({ inicial }: FormularioCotizacionProps) {
  const clienteQuery = useQueryClient();
  const productos = useProductos();
  const parametros = useParametros();
  const guardar = useGuardarBorradorCotizacion();
  const enviar = useEnviarCotizacion();
  const enLinea = useEnLinea();

  // ---- Estado del formulario (arranca con los valores iniciales y no se pierde si algo falla) ----
  const [idGuardado, setIdGuardado] = useState(inicial.id);
  const [numero, setNumero] = useState(inicial.numero);
  // false mientras una solicitud todavía no se ha guardado como borrador.
  const [esBorrador, setEsBorrador] = useState(inicial.id !== undefined && !inicial.esSolicitud);
  const [cliente, setCliente] = useState<ClienteElegido | null>(inicial.cliente);
  const [tipoServicio, setTipoServicio] = useState<TipoServicio | null>(inicial.tipoServicio);
  const [descuentoTexto, setDescuentoTexto] = useState(inicial.descuentoTexto);
  const [incluyeServicio, setIncluyeServicio] = useState(inicial.incluyeServicio);
  const [costoServicioTexto, setCostoServicioTexto] = useState(inicial.costoServicioTexto);
  const [lineas, setLineas] = useState<LineaEnFormulario[]>(inicial.lineas);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  // Los errores por campo se muestran después del primer intento de guardar o enviar.
  const [intentado, setIntentado] = useState(false);
  const [mensaje, setMensaje] = useState<MensajeFormulario | null>(null);
  // Acción que falló, para que Reintentar la repita (RNF-08).
  const [porReintentar, setPorReintentar] = useState<'guardar' | 'enviar' | null>(null);
  const [enviada, setEnviada] = useState<CotizacionGuardada | null>(null);
  // true durante los dos pasos de Enviar (guardar y enviar): el botón muestra la carga todo el tiempo.
  const [enviando, setEnviando] = useState(false);

  // ---- Datos derivados (se recalculan solo cuando cambia lo que usan) ----
  const productosPorId = useMemo(
    () => new Map((productos.data ?? []).map((producto) => [producto.id, producto])),
    [productos.data],
  );
  const lineasVista = useMemo(
    () => armarLineasVista(lineas, productosPorId, cliente?.tipo ?? null),
    [lineas, productosPorId, cliente],
  );
  // Al cálculo solo entran las líneas con precio; las demás muestran su error y no dejan guardar.
  const lineasCalculo = useMemo<LineaCalculo[]>(
    () =>
      lineasVista.flatMap((linea) =>
        linea.precio === null ? [] : [{ precio: linea.precio, cantidad: linea.cantidad }],
      ),
    [lineasVista],
  );
  const servicioIncluido = incluyeServicio ? tipoServicio : null;

  // Hook propio de J3: misma fórmula que el carrito y que el servidor (RF-17).
  const calculo = useCalculoTotal({
    lineas: lineasCalculo,
    servicio: servicioIncluido,
    descuentoTexto,
    costoServicioTexto: servicioIncluido ? costoServicioTexto : undefined,
  });

  // Si el tipo de servicio se eligió antes de que llegaran las tarifas (o tras un error que se
  // reintentó), el costo quedó vacío: al llegar los parámetros se propone la tarifa. Si el
  // trabajador ya escribió un valor, no se toca.
  const tarifas = parametros.data;
  useEffect(() => {
    if (tarifas && incluyeServicio && tipoServicio && costoServicioTexto === '') {
      setCostoServicioTexto(tarifaComoTexto(tipoServicio, tarifas));
    }
    // Solo cuando llegan las tarifas: si el trabajador borra el valor a propósito, no se rellena.
  }, [tarifas]);

  const errores = validarFormulario(cliente, tipoServicio, lineasVista);
  const ocupado = enviando || guardar.isPending || enviar.isPending;

  // La confirmación solo aparece cuando el servidor respondió que la envió.
  if (enviada) {
    return <ConfirmacionEnvio enviada={enviada} clienteNombre={cliente?.nombre ?? 'el cliente'} />;
  }

  // ---- Cambios en el formulario ----
  function alCambiar() {
    setMensaje(null);
    setPorReintentar(null);
  }

  function elegirCliente(elegido: ClienteElegido) {
    setCliente(elegido);
    alCambiar();
  }

  function elegirTipoServicio(tipo: TipoServicio) {
    setTipoServicio(tipo);
    // Se propone la tarifa del servicio elegido; el trabajador puede cambiarla (RF-17).
    setCostoServicioTexto(tarifaComoTexto(tipo, parametros.data));
    alCambiar();
  }

  function alternarServicio() {
    if (!incluyeServicio) {
      setCostoServicioTexto(tarifaComoTexto(tipoServicio, parametros.data));
    }
    setIncluyeServicio(!incluyeServicio);
    alCambiar();
  }

  function agregarProducto(producto: ProductoSegunRol) {
    setLineas((actuales) => [...actuales, { productoId: producto.id, cantidad: 1, nombreGuardado: producto.nombre }]);
    setSelectorAbierto(false);
    alCambiar();
  }

  function cambiarCantidad(productoId: string, cantidad: number) {
    setLineas((actuales) =>
      actuales.map((linea) => (linea.productoId === productoId ? { ...linea, cantidad } : linea)),
    );
    alCambiar();
  }

  function quitarLinea(productoId: string) {
    setLineas((actuales) => actuales.filter((linea) => linea.productoId !== productoId));
    alCambiar();
  }

  // ---- Guardar y enviar ----

  /** Datos para el servidor, o null si algo no es válido (los mensajes ya quedan en pantalla). */
  function datosParaGuardar(): DatosBorradorCotizacion | null {
    setIntentado(true);
    if (!formularioValido(errores) || !cliente || !tipoServicio || !calculo.desglose) {
      setMensaje({ tipo: 'error', texto: 'Revisa los campos marcados antes de continuar.' });
      return null;
    }
    return {
      id: idGuardado,
      clienteId: cliente.id,
      tipoServicio,
      descripcion: inicial.descripcion,
      descuento: calculo.desglose.descuento,
      incluyeServicio,
      valorServicio: incluyeServicio ? calculo.desglose.costoServicio : null,
      lineas: lineas.map((linea) => ({ productoId: linea.productoId, cantidad: linea.cantidad })),
    };
  }

  /** Guarda lo que devolvió el servidor: las siguientes veces se actualiza el mismo borrador. */
  function recordarGuardada(guardada: CotizacionGuardada) {
    setIdGuardado(guardada.id);
    setNumero(guardada.numero);
    setEsBorrador(true);
  }

  /** Texto de un fallo sin conexión: dice qué quedó en el servidor y que lo escrito sigue aquí. */
  function textoSinConexion(accion: 'guardar' | 'enviar'): string {
    let queQuedo = 'no se guardó';
    if (esBorrador) {
      queQuedo = `sigue como Borrador ${numero ?? ''} con lo último que guardaste`;
    } else if (inicial.esSolicitud) {
      queQuedo = `la solicitud ${numero ?? ''} sigue sin cambios`;
    }
    return accion === 'guardar'
      ? `Sin conexión. El borrador no se guardó; lo que escribiste sigue aquí. Intenta de nuevo cuando vuelva la conexión.`
      : `Sin conexión. La cotización no se envió y ${queQuedo}. Lo que escribiste sigue aquí.`;
  }

  function guardarBorrador() {
    if (ocupado) {
      return; // evita el doble envío (los botones además quedan bloqueados)
    }
    alCambiar();
    const datos = datosParaGuardar();
    if (!datos) {
      return;
    }
    // Sin conexión no se intenta: se informa y no se crea nada (RNF-08).
    if (!enLinea) {
      setPorReintentar('guardar');
      setMensaje({ tipo: 'error', texto: textoSinConexion('guardar') });
      return;
    }
    guardar.mutate(datos, {
      onSuccess: (guardada) => {
        recordarGuardada(guardada);
        setMensaje({ tipo: 'exito', texto: `Borrador ${guardada.numero} guardado. Puedes seguir editándolo.` });
      },
      onError: (error) => {
        setPorReintentar('guardar');
        setMensaje({
          tipo: 'error',
          texto: error.tipo === 'sin_conexion' ? textoSinConexion('guardar') : mensajeDeError(error),
        });
      },
    });
  }

  /**
   * Enviar al cliente (RF-18) en dos pasos:
   * 1. Guardar el borrador con la RPC (así el servidor tiene exactamente lo que se ve).
   * 2. Pasarlo a Nueva. Si este paso falla, la cotización queda como Borrador.
   * Entre los dos se compara el total del servidor con el de la pantalla: si cambió un precio o
   * una tarifa, no se envía un total distinto al que vio el trabajador.
   */
  async function enviarAlCliente() {
    if (ocupado) {
      return;
    }
    alCambiar();
    const datos = datosParaGuardar();
    const totalMostrado = calculo.desglose?.total;
    if (!datos || totalMostrado === undefined) {
      return;
    }
    if (!enLinea) {
      setPorReintentar('enviar');
      setMensaje({ tipo: 'error', texto: textoSinConexion('enviar') });
      return;
    }

    setEnviando(true);
    try {
      await guardarYEnviar(datos, totalMostrado);
    } finally {
      setEnviando(false);
    }
  }

  async function guardarYEnviar(datos: DatosBorradorCotizacion, totalMostrado: number) {
    // Paso 1: guardar.
    let guardada: CotizacionGuardada;
    try {
      guardada = await guardar.mutateAsync(datos);
      recordarGuardada(guardada);
    } catch (error) {
      setPorReintentar('enviar');
      const sinConexion = esErrorApi(error) && error.tipo === 'sin_conexion';
      setMensaje({
        tipo: 'error',
        texto: sinConexion
          ? textoSinConexion('enviar')
          : `No se pudo enviar. ${mensajeDeError(error)}`,
      });
      return;
    }

    if (guardada.total !== totalMostrado) {
      // Se piden de nuevo precios y tarifas para que la pantalla muestre el total actual.
      void clienteQuery.invalidateQueries({ queryKey: ['productos'] });
      void clienteQuery.invalidateQueries({ queryKey: CLAVE_PARAMETROS });
      setMensaje({
        tipo: 'error',
        texto:
          `No se envió: el servidor calculó ${formatearPrecio(guardada.total)} y la pantalla mostraba ` +
          `${formatearPrecio(totalMostrado)} (cambió un precio o una tarifa). Quedó como Borrador ` +
          `${guardada.numero}. Revisa el total y vuelve a enviar.`,
      });
      return;
    }

    // Paso 2: enviar.
    try {
      setEnviada(await enviar.mutateAsync(guardada.id));
    } catch (error) {
      setPorReintentar('enviar');
      const sinConexion = esErrorApi(error) && error.tipo === 'sin_conexion';
      setMensaje({
        tipo: 'error',
        texto:
          `No se pudo enviar${sinConexion ? ' porque no hay conexión' : `: ${mensajeDeError(error)}`}. ` +
          `La cotización quedó guardada como Borrador ${guardada.numero}.`,
      });
    }
  }

  function reintentar() {
    if (porReintentar === 'guardar') {
      guardarBorrador();
    } else if (porReintentar === 'enviar') {
      void enviarAlCliente();
    }
  }

  const nombreServicio = tipoServicio ? NOMBRE_TIPO_SERVICIO[tipoServicio].toLowerCase() : 'servicio';

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="px-pantalla py-seccion" keyboardShouldPersistTaps="handled">
        {numero ? (
          <Text className="mb-bloque font-cuerpo-medio text-base text-texto-suave">
            {esBorrador ? 'Borrador' : 'Solicitud'} {numero}
          </Text>
        ) : null}

        <SelectorCliente
          cliente={cliente}
          onElegir={elegirCliente}
          bloqueado={inicial.esSolicitud}
          error={intentado ? errores.cliente : null}
        />

        {inicial.descripcion ? (
          <View className="mb-bloque rounded-campo bg-superficie p-3">
            <Text className="font-cuerpo-semi text-sm text-texto">Necesidad del cliente</Text>
            <Text className="font-cuerpo text-base text-texto">{inicial.descripcion}</Text>
          </View>
        ) : null}

        <SelectorSegmentado<TipoServicio>
          etiqueta="Tipo de servicio"
          opciones={OPCIONES_SERVICIO}
          valor={tipoServicio}
          onCambiar={elegirTipoServicio}
          error={intentado ? errores.tipoServicio : null}
        />

        {/* Productos (mockup: título con "+ Agregar" a la derecha). */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-titulo text-xl text-texto">Productos</Text>
          <Pressable
            onPress={() => setSelectorAbierto(true)}
            disabled={!cliente}
            accessibilityRole="button"
            accessibilityLabel="Agregar producto"
            accessibilityState={{ disabled: !cliente }}
            hitSlop={8}
            className={`h-11 flex-row items-center ${cliente ? 'active:opacity-70' : 'opacity-40'}`}
          >
            <Feather name="plus" size={20} color={COLORES.primario} style={{ marginRight: 4 }} />
            <Text className="font-cuerpo-semi text-base text-primario">Agregar</Text>
          </Pressable>
        </View>
        {!cliente ? (
          <Text className="mb-bloque font-cuerpo text-sm text-texto-suave">
            Elige primero el cliente: su tipo define el precio de cada producto.
          </Text>
        ) : null}

        {inicial.avisos.length > 0 ? (
          <View className="mb-bloque rounded-campo bg-advertencia/15 p-3">
            <Text className="mb-1 font-cuerpo-semi text-sm text-texto">
              Productos de interés que no se agregaron:
            </Text>
            {inicial.avisos.map((aviso) => (
              <Text key={aviso} className="font-cuerpo text-sm text-texto">
                • {aviso}
              </Text>
            ))}
          </View>
        ) : null}

        {lineasVista.map((linea) => (
          <LineaCotizacionItem
            key={linea.productoId}
            linea={linea}
            onCambiarCantidad={(cantidad) => cambiarCantidad(linea.productoId, cantidad)}
            onQuitar={() => quitarLinea(linea.productoId)}
          />
        ))}
        {intentado && errores.lineas ? (
          <Text className="mb-bloque font-cuerpo text-sm text-error">{errores.lineas}</Text>
        ) : null}

        {/* Servicio: se puede quitar o cambiar su costo (RF-17). */}
        <Pressable
          onPress={alternarServicio}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: incluyeServicio }}
          className="mb-bloque mt-2 h-11 flex-row items-center active:opacity-70"
        >
          <Feather
            name={incluyeServicio ? 'check-square' : 'square'}
            size={22}
            color={incluyeServicio ? COLORES.primario : COLORES.textoSuave}
            style={{ marginRight: 10 }}
          />
          <Text className="font-cuerpo-medio text-base text-texto">Incluir costo de {nombreServicio}</Text>
        </Pressable>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <CampoTexto
              etiqueta="Descuento ($)"
              valor={descuentoTexto}
              onChangeText={(texto) => {
                setDescuentoTexto(texto);
                alCambiar();
              }}
              placeholder="0"
              tipoTeclado="numeric"
              error={calculo.errorDescuento}
              etiquetaDentro
            />
          </View>
          {servicioIncluido ? (
            <View className="flex-1">
              <CampoTexto
                etiqueta={`Costo de ${nombreServicio} ($)`}
                valor={costoServicioTexto}
                onChangeText={(texto) => {
                  setCostoServicioTexto(texto);
                  alCambiar();
                }}
                placeholder="0"
                tipoTeclado="numeric"
                error={calculo.errorServicio}
                etiquetaDentro
              />
            </View>
          ) : null}
        </View>

        <ResumenCotizacion calculo={calculo} servicio={servicioIncluido} />

        {mensaje ? (
          <View
            className={`mb-bloque flex-row items-start rounded-campo p-3 ${
              mensaje.tipo === 'exito' ? 'bg-exito/15' : 'bg-error/10'
            }`}
            accessibilityLiveRegion="polite"
          >
            <Feather
              name={mensaje.tipo === 'exito' ? 'check-circle' : 'alert-circle'}
              size={18}
              color={mensaje.tipo === 'exito' ? COLORES.exito : COLORES.error}
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <View className="flex-1">
              <Text className="font-cuerpo text-base text-texto">{mensaje.texto}</Text>
              {porReintentar ? (
                <Pressable onPress={reintentar} disabled={ocupado} accessibilityRole="button" hitSlop={8}>
                  <Text className="mt-1 font-cuerpo-semi text-base text-primario">Reintentar</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        <View className="mb-bloque">
          <Boton
            texto="Enviar al cliente"
            icono="send"
            onPress={() => {
              void enviarAlCliente();
            }}
            cargando={enviando}
            deshabilitado={ocupado}
          />
        </View>
        <Boton
          texto="Guardar borrador"
          variante="secundario"
          icono="save"
          onPress={guardarBorrador}
          cargando={guardar.isPending && !enviando}
          deshabilitado={ocupado}
        />
      </ScrollView>

      <SelectorProductoCotizacion
        visible={selectorAbierto}
        tipoCliente={cliente?.tipo ?? 'final'}
        idsEnCotizacion={lineas.map((linea) => linea.productoId)}
        onElegir={agregarProducto}
        onCerrar={() => setSelectorAbierto(false)}
      />
    </KeyboardAvoidingView>
  );
}

/** Cotización enviada: número, total y vencimiento que respondió el servidor. */
function ConfirmacionEnvio({ enviada, clienteNombre }: ConfirmacionEnvioCotizacionProps) {
  return (
    <View className="flex-1 items-center justify-center px-pantalla">
      <Feather name="check-circle" size={64} color={COLORES.exito} />
      <Text className="mt-5 text-center font-titulo text-2xl text-texto">Cotización enviada</Text>
      <Text className="mt-2 text-center font-cuerpo text-base text-texto-suave">
        {enviada.numero} llegó a la bandeja de {clienteNombre} como Nueva, por un total de{' '}
        {formatearPrecio(enviada.total)}.
        {enviada.venceEn ? ` Vence el ${formatearFecha(enviada.venceEn)}.` : ''}
      </Text>
      <View className="mt-seccion w-full max-w-xs">
        <Boton texto="Volver a Cotizaciones" onPress={() => router.back()} />
      </View>
    </View>
  );
}
