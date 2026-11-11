import { NOMBRE_TIPO_CLIENTE } from '../models/Cliente';
import type { CotizacionPersonal, TipoServicio } from '../models/Cotizacion';
import type {
  ClienteElegido,
  ErroresFormularioCotizacion,
  LineaEnFormulario,
  LineaVista,
  ValoresInicialesCotizacion,
} from '../models/FormularioCotizacion';
import type { ParametrosNegocio } from '../models/ParametrosNegocio';
import type { ProductoSegunRol, TipoCliente } from '../models/Producto';
import { precioParaCliente } from './precios';
import { mensajeInventario } from './validaciones';

/**
 * Reglas del formulario Crear cotización (F6, RF-16 a RF-18). Funciones puras: reciben datos y
 * devuelven resultados, sin pantallas ni peticiones, para poder explicarlas y probarlas aparte.
 */

/** Estados en los que una cotización todavía se puede editar (una enviada ya no, RF-18). */
export function esEditable(cotizacion: CotizacionPersonal): boolean {
  return cotizacion.estado === 'solicitada' || cotizacion.estado === 'borrador';
}

/** Tarifa del servicio como texto para el campo "Costo del servicio" ('' si aún no hay datos). */
export function tarifaComoTexto(
  tipoServicio: TipoServicio | null,
  parametros: ParametrosNegocio | undefined,
): string {
  if (!tipoServicio || !parametros) {
    return '';
  }
  const tarifa =
    tipoServicio === 'instalacion' ? parametros.tarifaInstalacion : parametros.tarifaMantenimiento;
  return String(Math.round(tarifa));
}

/**
 * Por qué un producto no se puede agregar a la cotización de un cliente de ese tipo (RF-16), o
 * null si sí se puede. El producto debe existir, tener unidades y tener precio para ese tipo.
 */
export function motivoNoAgregable(
  producto: ProductoSegunRol | undefined,
  tipoCliente: TipoCliente,
): string | null {
  if (!producto) {
    return 'Ya no está disponible en el inventario';
  }
  if (producto.inventario <= 0) {
    return 'Agotado';
  }
  if (precioParaCliente(producto, tipoCliente) === null) {
    return `Sin precio de ${NOMBRE_TIPO_CLIENTE[tipoCliente].toLowerCase()}. Regístralo en Productos para poder agregarlo`;
  }
  return null;
}

/**
 * Líneas para mostrar: junta lo que guarda el formulario (producto y cantidad) con el inventario
 * actual y el tipo del cliente. Cada línea trae su error si no se puede guardar así.
 */
export function armarLineasVista(
  lineas: readonly LineaEnFormulario[],
  productosPorId: ReadonlyMap<string, ProductoSegunRol>,
  tipoCliente: TipoCliente | null,
): LineaVista[] {
  return lineas.map((linea) => {
    const producto = productosPorId.get(linea.productoId);
    if (!producto) {
      return {
        productoId: linea.productoId,
        nombre: linea.nombreGuardado,
        codigo: null,
        imagenUrl: null,
        precio: null,
        inventario: 0,
        cantidad: linea.cantidad,
        error: 'Este producto ya no está disponible. Quítalo para continuar.',
      };
    }

    // Sin cliente todavía no se sabe qué precio aplica: se muestra el de cliente final.
    const tipo = tipoCliente ?? 'final';
    const precio = precioParaCliente(producto, tipo);
    let error: string | null = null;
    if (precio === null) {
      error = `No tiene precio de ${NOMBRE_TIPO_CLIENTE[tipo].toLowerCase()}. Quítalo o registra el precio en Productos.`;
    } else if (producto.inventario <= 0) {
      error = 'Agotado. Quítalo para continuar.';
    } else if (linea.cantidad > producto.inventario) {
      error = mensajeInventario(producto.inventario);
    }

    return {
      productoId: producto.id,
      nombre: producto.nombre,
      codigo: producto.codigo,
      imagenUrl: producto.imagenUrl,
      precio,
      inventario: producto.inventario,
      cantidad: linea.cantidad,
      error,
    };
  });
}

/** Mensajes por campo antes de guardar (RF-16): cliente, tipo de servicio y al menos una línea. */
export function validarFormulario(
  cliente: ClienteElegido | null,
  tipoServicio: TipoServicio | null,
  lineas: readonly LineaVista[],
): ErroresFormularioCotizacion {
  let errorLineas: string | null = null;
  if (lineas.length === 0) {
    errorLineas = 'Agrega al menos un producto';
  } else if (lineas.some((linea) => linea.error !== null)) {
    errorLineas = 'Revisa los productos marcados en rojo';
  }
  return {
    cliente: cliente === null ? 'Elige un cliente' : null,
    tipoServicio: tipoServicio === null ? 'Elige el tipo de servicio' : null,
    lineas: errorLineas,
  };
}

/** true si no hay ningún error de campo. */
export function formularioValido(errores: ErroresFormularioCotizacion): boolean {
  return errores.cliente === null && errores.tipoServicio === null && errores.lineas === null;
}

/** Formulario vacío para una cotización nueva. */
export function valoresVacios(): ValoresInicialesCotizacion {
  return {
    numero: null,
    esSolicitud: false,
    cliente: null,
    tipoServicio: null,
    descripcion: '',
    descuentoTexto: '0',
    incluyeServicio: true,
    costoServicioTexto: '',
    lineas: [],
    avisos: [],
  };
}

/**
 * Valores iniciales a partir de una cotización del servidor:
 * - Borrador: se continúa tal como quedó guardado.
 * - Solicitud: se precargan el cliente, el tipo de servicio y los productos de interés que se
 *   puedan agregar (cantidad pedida, o 1, sin pasar del inventario). Los que no se pueden
 *   agregar quedan en avisos con el motivo.
 */
export function valoresDesdeCotizacion(
  cotizacion: CotizacionPersonal,
  productosPorId: ReadonlyMap<string, ProductoSegunRol>,
): ValoresInicialesCotizacion {
  const cliente: ClienteElegido | null = cotizacion.cliente
    ? { id: cotizacion.cliente.id, nombre: cotizacion.cliente.nombre, tipo: cotizacion.cliente.tipo }
    : null;
  const comun = {
    id: cotizacion.id,
    numero: cotizacion.numero,
    cliente,
    tipoServicio: cotizacion.tipoServicio,
    descripcion: cotizacion.descripcion,
    incluyeServicio: cotizacion.incluyeServicio,
    costoServicioTexto: String(Math.round(cotizacion.valorServicio)),
  };

  if (cotizacion.estado === 'borrador') {
    return {
      ...comun,
      esSolicitud: false,
      descuentoTexto: String(Math.round(cotizacion.descuento)),
      lineas: cotizacion.lineas.map((linea) => ({
        productoId: linea.productoId,
        cantidad: linea.cantidad,
        nombreGuardado: linea.nombre,
      })),
      avisos: [],
    };
  }

  // Solicitud: productos de interés → líneas.
  const tipo = cliente?.tipo ?? 'final';
  const lineas: LineaEnFormulario[] = [];
  const avisos: string[] = [];
  for (const interes of cotizacion.productosInteres) {
    const producto = productosPorId.get(interes.productoId);
    const motivo = motivoNoAgregable(producto, tipo);
    if (motivo !== null || !producto) {
      avisos.push(`${interes.nombre}: ${motivo ?? 'no disponible'}`);
      continue;
    }
    lineas.push({
      productoId: producto.id,
      cantidad: Math.min(interes.cantidad ?? 1, producto.inventario),
      nombreGuardado: producto.nombre,
    });
  }

  return {
    ...comun,
    esSolicitud: true,
    descuentoTexto: '0',
    // Una solicitud trae el servicio que pidió el cliente, con la tarifa que puso el servidor.
    incluyeServicio: true,
    lineas,
    avisos,
  };
}
