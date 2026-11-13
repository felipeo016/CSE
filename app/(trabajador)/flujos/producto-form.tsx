import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import Boton from '../../../src/components/Boton';
import CampoTexto from '../../../src/components/CampoTexto';
import EstadoVista from '../../../src/components/EstadoVista';
import ImagenProducto from '../../../src/components/ImagenProducto';
import RutaProtegida from '../../../src/components/RutaProtegida';
import SelectorOpciones from '../../../src/components/SelectorOpciones';
import { COLORES } from '../../../src/config/colores';
import { useEliminarProducto } from '../../../src/hooks/useEliminarProducto';
import { useEnLinea } from '../../../src/hooks/useEnLinea';
import { useCrearProducto, useEditarProducto, useProducto } from '../../../src/hooks/useProductos';
import {
  esProductoPersonal,
  NOMBRE_CATEGORIA,
  NOMBRE_MARCA,
  PREFIJO_CODIGO_PROVISIONAL,
  type Categoria,
  type DatosProducto,
  type Marca,
} from '../../../src/models/Producto';
import { mensajeDeError } from '../../../src/services/api';
import type { ErrorApi } from '../../../src/types/api.types';
import type {
  AdvertenciaCampoProps,
  ContenidoPorIdProps,
  FormularioProductoProps,
} from '../../../src/types/props.types';
import { ROLES_PERSONAL } from '../../../src/utils/navegacion';
import {
  inventarioValido,
  requerido,
  textoANumero,
  urlImagenValida,
  valorEnPesos,
} from '../../../src/utils/validaciones';

/** Opciones de categoría: las ocho de 001_esquema.sql con su nombre legible (RF-07). */
const OPCIONES_CATEGORIA = (Object.keys(NOMBRE_CATEGORIA) as Categoria[]).map((valor) => ({
  valor,
  etiqueta: NOMBRE_CATEGORIA[valor],
}));

/** Opciones de marca: las tres que acepta la tabla productos. */
const OPCIONES_MARCA = (Object.keys(NOMBRE_MARCA) as Marca[]).map((valor) => ({
  valor,
  etiqueta: NOMBRE_MARCA[valor],
}));

/** Lo que escribe el trabajador: los números van como texto hasta validarlos. */
interface CamposProducto {
  codigo: string;
  nombre: string;
  descripcion: string;
  marca: Marca;
  categoria: Categoria;
  costo: string;
  precioInstalador: string;
  precioClienteFinal: string;
  inventario: string;
  imagenUrl: string;
}

type CampoConError =
  | 'codigo'
  | 'nombre'
  | 'costo'
  | 'precioInstalador'
  | 'precioClienteFinal'
  | 'inventario'
  | 'imagenUrl';
type ErroresProducto = Record<CampoConError, string | null>;

const SIN_ERRORES: ErroresProducto = {
  codigo: null,
  nombre: null,
  costo: null,
  precioInstalador: null,
  precioClienteFinal: null,
  inventario: null,
  imagenUrl: null,
};

const MENSAJE_SIN_CONEXION = 'Sin conexión. El producto no se guardó. Revisa tu conexión y pulsa Reintentar.';

/** Número guardado → texto del campo al editar (52000 → "52000"; null → ""). */
function numeroATexto(valor: number | null): string {
  return valor === null ? '' : String(valor);
}

/**
 * Formulario de producto (RF-29, RF-30). Sin parámetro crea un producto; con ?id= edita ese
 * producto y muestra también Eliminar (RF-31), como en el mockup "Editar producto".
 * Pantalla Stack: el título va en el encabezado.
 */
export default function FormularioProductoPantalla() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const esEdicion = typeof id === 'string' && id.length > 0;

  return (
    <RutaProtegida roles={ROLES_PERSONAL}>
      <Stack.Screen options={{ title: esEdicion ? 'Editar producto' : 'Nuevo producto' }} />
      <SafeAreaView className="flex-1 bg-fondo" edges={['bottom', 'left', 'right']}>
        {esEdicion ? <EdicionProducto id={id} /> : <FormularioProducto producto={null} />}
      </SafeAreaView>
    </RutaProtegida>
  );
}

/** Carga el producto a editar con sus estados de carga, error y "no encontrado". */
function EdicionProducto({ id }: ContenidoPorIdProps) {
  const consulta = useProducto(id);

  if (consulta.isPending) {
    return <EstadoVista tipo="carga" mensaje="Cargando producto…" />;
  }
  if (consulta.isError && consulta.data === undefined) {
    return (
      <EstadoVista
        tipo="error"
        mensaje="No se pudo cargar el producto"
        detalle={consulta.sinConexion ? 'Revisa tu conexión e inténtalo de nuevo' : consulta.error.mensaje}
        accion={{ texto: 'Reintentar', onPress: () => consulta.refetch() }}
      />
    );
  }
  // El personal siempre recibe ProductoPersonal; si no, se trata como no encontrado.
  if (!consulta.data || !esProductoPersonal(consulta.data)) {
    return (
      <EstadoVista
        tipo="vacio"
        mensaje="Producto no encontrado"
        detalle="Puede que ya se haya eliminado."
        accion={{ texto: 'Volver', onPress: () => router.back() }}
      />
    );
  }
  // key: si cambia el producto, el formulario se vuelve a crear con sus datos actuales (RF-30).
  return <FormularioProducto key={consulta.data.id} producto={consulta.data} />;
}

/** Formulario con los datos iniciales (vacío al crear; los del producto al editar). */
function FormularioProducto({ producto }: FormularioProductoProps) {
  const crear = useCrearProducto();
  const editar = useEditarProducto();
  const { confirmarEliminar, eliminando } = useEliminarProducto();
  const enLinea = useEnLinea();

  const [campos, setCampos] = useState<CamposProducto>({
    codigo: producto?.codigo ?? '',
    nombre: producto?.nombre ?? '',
    descripcion: producto?.descripcion ?? '',
    marca: producto?.marca ?? 'Hikvision',
    categoria: producto?.categoria ?? 'camaras_turbo_hd',
    costo: numeroATexto(producto?.costo ?? null),
    precioInstalador: numeroATexto(producto?.precioInstalador ?? null),
    precioClienteFinal: numeroATexto(producto?.precioClienteFinal ?? null),
    inventario: numeroATexto(producto?.inventario ?? null),
    imagenUrl: producto?.imagenUrl ?? '',
  });
  const [errores, setErrores] = useState<ErroresProducto>(SIN_ERRORES);
  // Error del último intento de guardar (del servidor o por falta de conexión).
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [ultimoFueSinConexion, setUltimoFueSinConexion] = useState(false);

  const guardando = crear.isPending || editar.isPending;

  function cambiarCampo(campo: CampoConError | 'descripcion', valor: string) {
    setCampos((anteriores) => ({ ...anteriores, [campo]: valor }));
    if (campo !== 'descripcion') {
      setErrores((anteriores) => ({ ...anteriores, [campo]: null }));
    }
    setErrorEnvio(null);
  }

  // ---- Advertencias: se muestran mientras se escribe, pero no impiden guardar. ----
  const codigo = campos.codigo.trim();
  const sinCodigo = codigo === '';
  const codigoProvisional = codigo.toUpperCase().startsWith(PREFIJO_CODIGO_PROVISIONAL);
  const sinPrecioInstalador = campos.precioInstalador.trim() === '';
  // Solo se compara cuando los valores ya son números válidos.
  const costoNumero = valorEnPesos(campos.costo) === null ? textoANumero(campos.costo) : null;
  function menorQueCosto(texto: string): boolean {
    return costoNumero !== null && valorEnPesos(texto) === null && textoANumero(texto) < costoNumero;
  }
  const finalBajoCosto = menorQueCosto(campos.precioClienteFinal);
  const instaladorBajoCosto = !sinPrecioInstalador && menorQueCosto(campos.precioInstalador);
  // Vista previa solo con una dirección válida; si no, la imagen genérica.
  const imagenEscrita = campos.imagenUrl.trim();
  const urlVistaPrevia = imagenEscrita !== '' && urlImagenValida(imagenEscrita) === null ? imagenEscrita : null;

  /** Valida cada campo con su propio mensaje (CP-08). Devuelve los datos listos o null. */
  function validar(): DatosProducto | null {
    const nuevos: ErroresProducto = {
      codigo: null,
      nombre: requerido(campos.nombre, 'el nombre del producto'),
      costo: valorEnPesos(campos.costo),
      // Vacío se permite: el producto queda sin precio para instaladores (con advertencia).
      precioInstalador: sinPrecioInstalador ? null : valorEnPesos(campos.precioInstalador),
      precioClienteFinal: valorEnPesos(campos.precioClienteFinal),
      inventario: inventarioValido(campos.inventario),
      imagenUrl: urlImagenValida(campos.imagenUrl),
    };
    setErrores(nuevos);
    if (Object.values(nuevos).some((error) => error !== null)) {
      return null;
    }
    return {
      codigo: campos.codigo,
      nombre: campos.nombre,
      descripcion: campos.descripcion,
      marca: campos.marca,
      categoria: campos.categoria,
      costo: textoANumero(campos.costo),
      precioInstalador: sinPrecioInstalador ? null : textoANumero(campos.precioInstalador),
      precioClienteFinal: textoANumero(campos.precioClienteFinal),
      inventario: textoANumero(campos.inventario),
      imagenUrl: campos.imagenUrl,
    };
  }

  function alFallar(error: ErrorApi) {
    // El código repetido se muestra bajo el campo Código (23505 → "Ya existe un producto con ese código").
    if (error.codigo === '23505') {
      setErrores((anteriores) => ({ ...anteriores, codigo: error.mensaje }));
      setUltimoFueSinConexion(false);
      setErrorEnvio(error.mensaje);
      return;
    }
    setUltimoFueSinConexion(error.tipo === 'sin_conexion');
    setErrorEnvio(error.tipo === 'sin_conexion' ? MENSAJE_SIN_CONEXION : mensajeDeError(error));
  }

  function guardar() {
    if (guardando || eliminando) {
      return;
    }
    const datos = validar();
    if (!datos) {
      return;
    }
    // Sin conexión no se intenta: se informa y no se guarda nada (RNF-08).
    if (!enLinea) {
      setUltimoFueSinConexion(true);
      setErrorEnvio(MENSAJE_SIN_CONEXION);
      return;
    }
    setErrorEnvio(null);

    // Solo se sale del formulario cuando el servidor confirmó que guardó.
    if (producto) {
      editar.mutate({ id: producto.id, datos }, { onSuccess: () => router.back(), onError: alFallar });
    } else {
      crear.mutate(datos, { onSuccess: () => router.back(), onError: alFallar });
    }
  }

  const textoBoton = ultimoFueSinConexion && errorEnvio ? 'Reintentar' : 'Guardar';

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="px-pantalla py-seccion" keyboardShouldPersistTaps="handled">
        <CampoTexto
          etiqueta="Código"
          valor={campos.codigo}
          onChangeText={(valor) => cambiarCampo('codigo', valor)}
          placeholder="DS-7204HGHI-M1"
          error={errores.codigo}
          autoCapitalize="characters"
          etiquetaDentro
        />
        {sinCodigo && !errores.codigo ? (
          <Advertencia texto="Sin código: el producto se puede guardar, pero será más difícil encontrarlo. Agrégalo cuando lo tengas." />
        ) : null}
        {codigoProvisional && !errores.codigo ? (
          <Advertencia texto="Código provisional de la carga del Excel. Reemplázalo por el código real del producto." />
        ) : null}

        <CampoTexto
          etiqueta="Nombre"
          valor={campos.nombre}
          onChangeText={(valor) => cambiarCampo('nombre', valor)}
          placeholder="Cámara Turbo 1080P Turret"
          error={errores.nombre}
          etiquetaDentro
        />

        <SelectorOpciones<Categoria>
          etiqueta="Categoría"
          opciones={OPCIONES_CATEGORIA}
          valor={campos.categoria}
          onCambiar={(categoria) => setCampos((anteriores) => ({ ...anteriores, categoria }))}
        />

        <SelectorOpciones<Marca>
          etiqueta="Marca"
          opciones={OPCIONES_MARCA}
          valor={campos.marca}
          onCambiar={(marca) => setCampos((anteriores) => ({ ...anteriores, marca }))}
        />

        {/* Costo y precio instalador lado a lado, como en el mockup. */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <CampoTexto
              etiqueta="Costo"
              valor={campos.costo}
              onChangeText={(valor) => cambiarCampo('costo', valor)}
              placeholder="52000"
              error={errores.costo}
              tipoTeclado="numeric"
              etiquetaDentro
            />
          </View>
          <View className="flex-1">
            <CampoTexto
              etiqueta="Precio instalador"
              valor={campos.precioInstalador}
              onChangeText={(valor) => cambiarCampo('precioInstalador', valor)}
              placeholder="65000"
              error={errores.precioInstalador}
              tipoTeclado="numeric"
              etiquetaDentro
            />
          </View>
        </View>
        {sinPrecioInstalador ? (
          <Advertencia texto="Sin precio instalador: los clientes instaladores no podrán comprar ni cotizar este producto hasta que lo registres." />
        ) : null}
        {instaladorBajoCosto ? (
          <Advertencia texto="El precio instalador es menor que el costo." />
        ) : null}

        <CampoTexto
          etiqueta="Precio cliente final"
          valor={campos.precioClienteFinal}
          onChangeText={(valor) => cambiarCampo('precioClienteFinal', valor)}
          placeholder="79000"
          error={errores.precioClienteFinal}
          tipoTeclado="numeric"
          etiquetaDentro
        />
        {finalBajoCosto ? <Advertencia texto="El precio cliente final es menor que el costo." /> : null}
        <Text className="-mt-2 mb-bloque font-cuerpo text-sm text-texto-suave">
          Valores en pesos, sin puntos de miles (por ejemplo 79000).
        </Text>

        <CampoTexto
          etiqueta="Inventario"
          valor={campos.inventario}
          onChangeText={(valor) => cambiarCampo('inventario', valor)}
          placeholder="8"
          error={errores.inventario}
          tipoTeclado="number-pad"
          etiquetaDentro
        />

        <CampoTexto
          etiqueta="Descripción (opcional)"
          valor={campos.descripcion}
          onChangeText={(valor) => cambiarCampo('descripcion', valor)}
          placeholder="Características principales del producto"
          etiquetaDentro
          multilinea
        />

        {/* Imagen opcional: por ahora se escribe la dirección (URL) de la imagen. */}
        <Text className="mb-2 font-cuerpo-semi text-base text-texto">Imagen</Text>
        <View className="mb-3 flex-row items-center rounded-campo border border-borde p-3">
          {/* key: al cambiar la dirección se vuelve a intentar cargar la imagen. */}
          <ImagenProducto key={urlVistaPrevia ?? ''} imagenUrl={urlVistaPrevia} tamano="miniatura" />
          <Text className="ml-3 flex-1 font-cuerpo text-sm text-texto-suave">
            {campos.imagenUrl.trim() === ''
              ? 'Sin imagen: se mostrará la imagen genérica.'
              : 'Vista previa de la imagen.'}
          </Text>
        </View>
        <CampoTexto
          etiqueta="Dirección de la imagen (opcional)"
          valor={campos.imagenUrl}
          onChangeText={(valor) => cambiarCampo('imagenUrl', valor)}
          placeholder="https://…"
          error={errores.imagenUrl}
          tipoTeclado="url"
          autoCapitalize="none"
          etiquetaDentro
        />

        {errorEnvio ? (
          <Text className="mb-bloque font-cuerpo text-base text-error" accessibilityLiveRegion="polite">
            {errorEnvio}
          </Text>
        ) : null}

        <View className="mt-bloque gap-3">
          <Boton
            texto={textoBoton}
            onPress={guardar}
            cargando={guardando}
            deshabilitado={eliminando}
            icono={textoBoton === 'Reintentar' ? 'refresh-cw' : 'save'}
          />
          {producto ? (
            <Boton
              texto="Eliminar"
              variante="peligro"
              icono="trash-2"
              onPress={() => confirmarEliminar(producto, () => router.back())}
              cargando={eliminando}
              deshabilitado={guardando}
            />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Advertencia naranja bajo un campo: avisa, pero no impide guardar. */
function Advertencia({ texto }: AdvertenciaCampoProps) {
  return (
    <View className="-mt-2 mb-bloque flex-row items-start" accessibilityLiveRegion="polite">
      <Feather name="alert-triangle" size={16} color={COLORES.advertencia} style={{ marginRight: 6, marginTop: 2 }} />
      <Text className="flex-1 font-cuerpo text-sm text-texto">{texto}</Text>
    </View>
  );
}
