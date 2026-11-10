import type { ComponentProps, ReactNode } from 'react';
import type { KeyboardTypeOptions } from 'react-native';
import type { Feather } from '@expo/vector-icons';

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
