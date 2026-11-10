import type { ComponentProps, ReactNode } from 'react';
import type { KeyboardTypeOptions } from 'react-native';
import type { Feather } from '@expo/vector-icons';

import type { LineaCarrito, ServicioCarrito } from '../models/Carrito';
import type { Cliente } from '../models/Cliente';
import type { SolicitudCreada } from '../models/Cotizacion';
import type { ProductoPersonal, ProductoSegunRol } from '../models/Producto';
import type { Rol, Usuario } from '../models/Usuario';

/** Nombre de un ícono del set Feather (@expo/vector-icons), el estilo de íconos del mockup. */
export type NombreIcono = ComponentProps<typeof Feather>['name'];

/** Variantes visuales del botón: azul relleno, borde azul o borde rojo (acciones destructivas). */
export type VarianteBoton = 'primario' | 'secundario' | 'peligro';

export interface BotonProps {
  /** Texto visible del botón. */
  texto: string;
  /** Acción al pulsar. No se ejecuta si el botón está deshabilitado o cargando. */
  onPress: () => void;
  /** Por defecto 'primario'. */
  variante?: VarianteBoton;
  deshabilitado?: boolean;
  /** Muestra un indicador de carga y bloquea el botón (evita el doble envío). */
  cargando?: boolean;
  /** Ícono opcional a la izquierda del texto. */
  icono?: NombreIcono;
}

/** Los tres estados que muestra una pantalla con datos remotos (RNF-02). */
export type TipoEstadoVista = 'carga' | 'error' | 'vacio';

/** Acción opcional de EstadoVista: Reintentar, Limpiar búsqueda, Volver... */
export interface AccionEstadoVista {
  texto: string;
  onPress: () => void;
}

export interface EstadoVistaProps {
  tipo: TipoEstadoVista;
  /** Mensaje principal, por ejemplo "No se pudo cargar el catálogo". */
  mensaje: string;
  /** Texto de ayuda opcional bajo el mensaje. */
  detalle?: string;
  accion?: AccionEstadoVista;
}

export interface CampoTextoProps {
  etiqueta: string;
  valor: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
  /** Mensaje de error que se muestra bajo el campo; null o undefined si el campo es válido. */
  error?: string | null;
  /** Tipo de teclado: 'default', 'email-address', 'phone-pad', 'numeric'... */
  tipoTeclado?: KeyboardTypeOptions;
  /** Oculta el texto y muestra el botón del ojo para verlo. */
  esContrasena?: boolean;
  /** Ícono a la izquierda del texto. */
  icono?: NombreIcono;
  /** Por defecto 'sentences'; en correo y contraseña se usa 'none'. */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /**
   * true: la etiqueta va dentro del recuadro, en letra pequeña sobre el valor (mockup de Registro).
   * false (por defecto): la etiqueta va encima del recuadro (mockup de Iniciar sesión).
   */
  etiquetaDentro?: boolean;
  /** true: campo de varias líneas (por ejemplo, la descripción de una solicitud). */
  multilinea?: boolean;
}

/** Pantalla que pertenece a un prompt futuro: título y aviso "En construcción — [ID]". */
export interface PantallaEnConstruccionProps {
  titulo: string;
  /** ID del prompt que completará la pantalla, por ejemplo 'J3'. */
  prompt: string;
  /**
   * true en las pantallas Stack, donde el título ya aparece en el encabezado junto a la flecha
   * atrás; así no se repite. Por defecto false (el título grande va dentro de la pantalla).
   */
  tituloEnEncabezado?: boolean;
}

/** Formulario de Perfil: recibe los datos de la cuenta ya cargados del servidor. */
export interface FormularioPerfilProps {
  usuario: Usuario;
}

/** Envuelve una pantalla o un grupo y solo la muestra a los roles permitidos (RF-03, RNF-05). */
export interface RutaProtegidaProps {
  roles: readonly Rol[];
  children: ReactNode;
}

/** Una opción del menú lateral (Drawer). */
export interface OpcionMenu {
  /** Nombre de la pantalla dentro del Drawer: el archivo sin extensión, por ejemplo 'mis-pedidos'. */
  pantalla: string;
  etiqueta: string;
  icono: NombreIcono;
}

/** Contenido personalizado del Drawer: datos del usuario, opciones de su rol y Cerrar sesión. */
export interface MenuLateralProps {
  opciones: OpcionMenu[];
  /** Pantalla abierta en el Drawer, para resaltar su opción. */
  pantallaActual: string;
  /** Abre la pantalla elegida y cierra el menú. */
  onElegir: (pantalla: string) => void;
}

/** Botón de las tres rayas que abre el Drawer. */
export interface BotonMenuProps {
  onPress: () => void;
}

/** Una opción de SelectorSegmentado. */
export interface OpcionSegmentada<T extends string> {
  valor: T;
  etiqueta: string;
}

/**
 * Botones lado a lado para elegir una sola opción (mockup de Solicitar cotización:
 * Instalación / Mantenimiento). La elegida va en azul con un check.
 */
export interface SelectorSegmentadoProps<T extends string> {
  etiqueta: string;
  opciones: readonly OpcionSegmentada<T>[];
  /** null si todavía no se elige ninguna. */
  valor: T | null;
  onCambiar: (valor: T) => void;
  /** Mensaje de error bajo los botones; null o undefined si es válido. */
  error?: string | null;
}

/** Barra de búsqueda gris con lupa y botón para borrar (mockup de Clientes y Catálogo). */
export interface BarraBusquedaProps {
  valor: string;
  onChangeText: (texto: string) => void;
  placeholder: string;
}

/** Círculo azul claro con las iniciales del cliente (mockup de Clientes). */
export interface AvatarInicialesProps {
  iniciales: string;
  /** 'normal' en la lista; 'grande' en el detalle. */
  tamano?: 'normal' | 'grande';
}

/** Aviso amarillo de "Sin conexión" sobre una lista que muestra datos guardados (RNF-08). */
export interface AvisoConexionProps {
  mensaje: string;
}

/** Tarjeta de la lista de clientes: iniciales, nombre y teléfono (mockup de Clientes). */
export interface TarjetaClienteProps {
  cliente: Cliente;
  onPress: () => void;
}

/** Pantallas que cargan un registro por el id de la ruta (detalle, edición). */
export interface ContenidoPorIdProps {
  /** undefined si la ruta llegó sin id. */
  id: string | undefined;
}

/** Formulario de cliente: null para crear; el cliente cargado para editar. */
export interface FormularioClienteProps {
  cliente: Cliente | null;
}

/** Tarjeta con los datos del cliente en su detalle. */
export interface TarjetaDatosClienteProps {
  cliente: Cliente;
}

/** Una fila "ícono · etiqueta · valor" de una tarjeta de datos (mockup del detalle de cliente). */
export interface FilaDatoProps {
  icono: NombreIcono;
  etiqueta: string;
  valor: string;
}

/** Producto elegido como de interés en Solicitar cotización. */
export interface ProductoElegido {
  id: string;
  nombre: string;
}

/** Buscador del catálogo para elegir productos de interés (opcionales) al solicitar (RF-15). */
export interface SelectorProductosInteresProps {
  elegidos: ProductoElegido[];
  onCambiar: (elegidos: ProductoElegido[]) => void;
}

/** Mensaje de solicitud registrada, con el número que devolvió el servidor. */
export interface ConfirmacionSolicitudProps {
  solicitud: SolicitudCreada;
}

/** Imagen de un producto; si no tiene o no carga, muestra la imagen alternativa (RNF-02). */
export interface ImagenProductoProps {
  imagenUrl: string | null;
  /** 'miniatura' en tarjetas y carrito; 'grande' en el detalle. */
  tamano: 'miniatura' | 'grande';
}

/** Botón opcional de la tarjeta de producto, por ejemplo "+ Agregar" en el catálogo del cliente. */
export interface AccionTarjetaProducto {
  texto: string;
  icono?: NombreIcono;
  onPress: () => void;
}

/** Tarjeta de producto del catálogo (mockup de Catálogo, RF-05, RF-09). */
export interface TarjetaProductoProps {
  nombre: string;
  /** null si el producto no tiene código: se muestra "Sin código". */
  codigo: string | null;
  /** Nombre legible de la marca y de la categoría (NOMBRE_MARCA, NOMBRE_CATEGORIA). */
  marca: string;
  categoria: string;
  /** Precio en pesos; null si no hay precio registrado para el cliente. */
  precio: number | null;
  /** Unidades disponibles. Con 0 se muestra la etiqueta "Agotado". */
  inventario: number;
  imagenUrl: string | null;
  /** Abre el detalle del producto. */
  onPress: () => void;
  /** Botón opcional; no se muestra si el producto está agotado o no tiene precio. */
  accion?: AccionTarjetaProducto;
}

/** Etiqueta verde "Disponibles: N" o roja "Agotado". */
export interface EtiquetaDisponibilidadProps {
  inventario: number;
}

/**
 * Contador contextual de cantidad (RF-10, RF-16): botones − y + y entrada escrita a mano.
 * La cantidad válida va de `minimo` a `maximo` (el inventario).
 */
export interface ContadorCantidadProps {
  valor: number;
  /** Unidades disponibles: el + se deshabilita al llegar aquí. */
  maximo: number;
  /** Por defecto 1: el − no baja de aquí. */
  minimo?: number;
  /** Se llama solo con cantidades válidas. */
  onCambiar: (cantidad: number) => void;
  /** Nombre del producto para el lector de pantalla, por ejemplo "Cantidad de DVR 4 canales". */
  etiquetaAccesible?: string;
}

/** Chip de filtro (mockup de Catálogo: Cámaras, DVR, WiFi...). El activo va en azul. */
export interface ChipFiltroProps {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
}

/** Precios que ve el personal en el detalle: cliente final, instalador y costo. */
export interface PreciosPersonalProps {
  producto: ProductoPersonal;
}

/** Parte del detalle donde el cliente elige la cantidad y agrega al carrito. */
export interface CompraClienteProps {
  producto: ProductoSegunRol;
}

/** Una fila "etiqueta ........ valor" del resumen del carrito. */
export interface FilaResumenProps {
  etiqueta: string;
  valor: string;
  /** 'total' la muestra grande y en negrita; 'descuento' en verde. */
  variante?: 'normal' | 'descuento' | 'total';
}

/** Una línea del carrito con su contador y el botón Quitar. */
export interface LineaCarritoItemProps {
  linea: LineaCarrito;
}

/** Resumen del total del carrito (subtotal, descuento, impuesto, servicio y total). */
export interface ResumenCarritoProps {
  lineas: LineaCarrito[];
  servicio: ServicioCarrito;
}

/** Opciones de servicio del carrito: sin servicio, instalación o mantenimiento (suma la tarifa). */
export interface SelectorServicioProps {
  servicio: ServicioCarrito;
  onCambiar: (servicio: ServicioCarrito) => void;
}
