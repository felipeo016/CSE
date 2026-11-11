import { useMemo } from 'react';

import { useParametros } from './useParametros';
import type { DesgloseTotal, LineaCalculo } from '../models/Calculo';
import type { TipoServicio } from '../models/Cotizacion';
import {
  calcularTotal,
  costoServicio,
  leerMonto,
  subtotalGeneral,
  validarDescuento,
} from '../utils/calculos';

/** Entradas de useCalculoTotal. */
export interface EntradaCalculoTotal {
  /** Líneas con precio unitario y cantidad (las del carrito o las de la cotización). */
  lineas: readonly LineaCalculo[];
  /** Servicio pedido: suma su costo al total. null = sin servicio. */
  servicio: TipoServicio | null;
  /**
   * Descuento en pesos tal como se escribe en el campo (F6). Opcional: el carrito no lo envía y
   * vale "0" (decisión del equipo: descuento 0 en el carrito).
   */
  descuentoTexto?: string;
  /**
   * Costo del servicio en pesos tal como lo escribe el trabajador (F6, RF-17). Opcional: si no se
   * envía (carrito) se usa la tarifa de instalación o mantenimiento de parametros_negocio.
   */
  costoServicioTexto?: string;
}

/** Lo que devuelve useCalculoTotal. */
export interface ResultadoCalculoTotal {
  /** El resumen completo, o null mientras cargan los parámetros o si hay errores. */
  desglose: DesgloseTotal | null;
  /** Mensajes en español de los datos inválidos ("Ingrese un valor numérico"...). Vacío si todo está bien. */
  errores: string[];
  /** Mensaje para mostrar bajo el campo Descuento; null si es válido (F6). */
  errorDescuento: string | null;
  /** Mensaje para mostrar bajo el campo del costo del servicio; null si es válido (F6). */
  errorServicio: string | null;
  /** true mientras se piden por primera vez el IVA y las tarifas. */
  cargando: boolean;
  /** Mensaje si no se pudieron traer los parámetros (y no hay copia en caché). */
  errorParametros: string | null;
  /** Vuelve a pedir los parámetros (botón Reintentar). */
  reintentar: () => void;
}

/**
 * Hook propio del cálculo del total (RF-12, RF-17). Lo usan el Carrito (J3) y Crear cotización (F6),
 * así los dos calculan con la misma lógica de la sección 5 y con la misma fórmula del servidor.
 *
 * Entradas: las líneas (precio × cantidad), el servicio pedido y, opcionales, el texto del
 * descuento y el texto del costo del servicio (los dos campos de la cotización).
 *
 * Estado: no guarda estado propio con useState. Usa el estado de useParametros (TanStack Query)
 * para el IVA y las tarifas de instalación y mantenimiento, que viven en la tabla
 * parametros_negocio de Supabase (los mismos con los que calcula el servidor).
 *
 * Efectos: ninguno propio. La petición de los parámetros la hace TanStack Query (con su caché de
 * 30 min) y el cálculo se repite con useMemo solo cuando cambian las líneas, el servicio, los
 * textos o los parámetros; así no se recalcula en cada render.
 *
 * Resultado: el desglose (subtotal, descuento, base, impuesto, servicio y total) o los errores
 * (en lista y por campo), más el estado de carga y error de los parámetros con su reintentar.
 *
 * @example
 * const { desglose } = useCalculoTotal({ lineas, servicio: 'instalacion' });
 * // desglose?.total → 574830 con 2 cámaras de 79.000 y 1 DVR de 199.000 (IVA 19 %, instalación 150.000)
 */
export function useCalculoTotal({
  lineas,
  servicio,
  descuentoTexto = '0',
  costoServicioTexto,
}: EntradaCalculoTotal): ResultadoCalculoTotal {
  const parametros = useParametros();
  const datos = parametros.data;

  const calculo = useMemo(() => {
    // Sin parámetros no se puede calcular el impuesto ni el servicio.
    if (!datos) {
      return { desglose: null, errores: [], errorDescuento: null, errorServicio: null };
    }

    // 1. Descuento: número entero de pesos, no negativo y no mayor que el subtotal.
    let errorDescuento: string | null = null;
    const descuento = leerMonto(descuentoTexto);
    if (!descuento.ok) {
      errorDescuento = descuento.errores[0];
    } else {
      const subtotal = subtotalGeneral(lineas);
      const valido = subtotal.ok ? validarDescuento(descuento.valor, subtotal.valor) : null;
      if (valido && !valido.ok) {
        errorDescuento = valido.errores[0];
      }
    }

    // 2. Servicio: la tarifa, o el valor que escribió el trabajador si el campo existe.
    let errorServicio: string | null = null;
    let valorServicio = costoServicio(servicio, datos);
    if (servicio !== null && costoServicioTexto !== undefined) {
      const escrito = leerMonto(costoServicioTexto);
      if (escrito.ok) {
        valorServicio = escrito.valor;
      } else {
        errorServicio = escrito.errores[0];
      }
    }

    if (!descuento.ok || errorDescuento || errorServicio) {
      const errores = [errorDescuento, errorServicio].filter((error): error is string => error !== null);
      return { desglose: null, errores, errorDescuento, errorServicio };
    }

    // 3. Total con la fórmula de la sección 5 (la misma del servidor).
    const resultado = calcularTotal({
      lineas,
      descuento: descuento.valor,
      impuestoPorcentaje: datos.impuestoPorcentaje,
      costoServicio: valorServicio,
    });

    return resultado.ok
      ? { desglose: resultado.valor, errores: [], errorDescuento: null, errorServicio: null }
      : { desglose: null, errores: resultado.errores, errorDescuento: null, errorServicio: null };
  }, [datos, lineas, servicio, descuentoTexto, costoServicioTexto]);

  return {
    ...calculo,
    cargando: parametros.isPending,
    errorParametros: parametros.isError && !datos ? parametros.error.mensaje : null,
    reintentar: () => {
      void parametros.refetch();
    },
  };
}
