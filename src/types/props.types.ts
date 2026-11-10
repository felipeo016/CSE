import type { ComponentProps } from 'react';
import type { KeyboardTypeOptions } from 'react-native';
import type { Feather } from '@expo/vector-icons';

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
}

/** Pantalla que pertenece a un prompt futuro: título y aviso "En construcción — [ID]". */
export interface PantallaEnConstruccionProps {
  titulo: string;
  /** ID del prompt que completará la pantalla, por ejemplo 'J3'. */
  prompt: string;
}
