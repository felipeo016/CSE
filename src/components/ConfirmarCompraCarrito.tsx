import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';

import AvisoErrorAccion from './AvisoErrorAccion';
import Boton from './Boton';
import { useCalculoTotal } from '../hooks/useCalculoTotal';
import { useEnLinea } from '../hooks/useEnLinea';
import { useRegistrarPedidoCarrito } from '../hooks/usePedidos';
import { NOMBRE_TIPO_SERVICIO } from '../models/Cotizacion';
import { useCarritoStore } from '../store/carritoStore';
import type { ErrorApi } from '../types/api.types';
import type { ConfirmarCompraCarritoProps } from '../types/props.types';
import { formatearPrecio } from '../utils/formato';
import { rutaConfirmacionPedido } from '../utils/navegacion';

/** Error de la última compra, ya listo para mostrar. */
interface ErrorCompra {
  titulo: string;
  mensaje: string;
  /** true si tiene sentido repetir la compra tal cual (sin conexión o falla del servidor). */
  reintentable: boolean;
  sinConexion: boolean;
}

const ERROR_SIN_CONEXION: ErrorCompra = {
  titulo: 'Sin conexión',
  mensaje:
    'No se registró el pedido y tu carrito sigue igual. Revisa tu conexión y pulsa Reintentar.',
  reintentable: true,
  sinConexion: true,
};

/** Traduce el error del servidor a lo que ve el cliente (hints de docs/servicio-remoto.md). */
function errorParaMostrar(error: ErrorApi): ErrorCompra {
  if (error.tipo === 'sin_conexion') {
    return ERROR_SIN_CONEXION;
  }
  if (error.codigo === 'INVENTARIO_INSUFICIENTE') {
    // El mensaje del servidor ya trae producto y unidades: "Solo hay 2 unidades disponibles de X".
    return {
      titulo: 'No hay inventario suficiente',
      mensaje: `${error.mensaje.replace(/\.$/, '')}. No se registró el pedido: ajusta la cantidad o quita el producto.`,
      reintentable: false,
      sinConexion: false,
    };
  }
  return {
    titulo: 'No se pudo registrar el pedido',
    mensaje: `${error.mensaje.replace(/\.$/, '')}. Tu carrito sigue igual.`,
    reintentable: error.tipo === 'servidor',
    sinConexion: false,
  };
}

/**
 * Confirmar pedido del carrito (RF-13). Primero un paso que dice "Pago simulado" (no hay pasarela
 * de pago real); luego la RPC registrar_pedido_carrito.
 * - Si sale bien: se vacía el carrito y se va a la Confirmación de pedido con el número y el total
 *   que devolvió el servidor (useRegistrarPedidoCarrito ya invalidó productos y pedidos).
 * - Si falta inventario: se muestra el producto y las unidades disponibles y no se registra nada.
 * - Sin conexión o con error: no se confirma, el carrito se conserva y se ofrece Reintentar (RNF-08).
 */
export default function ConfirmarCompraCarrito({ lineas, servicio }: ConfirmarCompraCarritoProps) {
  const comprar = useRegistrarPedidoCarrito();
  const enLinea = useEnLinea();
  const vaciar = useCarritoStore((estado) => estado.vaciar);
  // Mismo hook que el resumen: el total que se muestra en el paso de pago es el del resumen.
  const { desglose } = useCalculoTotal({ lineas, servicio });
  const [error, setError] = useState<ErrorCompra | null>(null);

  function registrar() {
    if (comprar.isPending) {
      return; // sin doble envío (el botón además queda bloqueado mientras carga)
    }
    // Sin conexión no se intenta: se informa y no se crea nada.
    if (!enLinea) {
      setError(ERROR_SIN_CONEXION);
      return;
    }
    setError(null);

    // Se guardan antes de vaciar el carrito: los necesita la pantalla de confirmación.
    const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
    const nombreServicio = servicio ? NOMBRE_TIPO_SERVICIO[servicio] : null;

    comprar.mutate(
      {
        lineas: lineas.map((linea) => ({ productoId: linea.productoId, cantidad: linea.cantidad })),
        servicio,
      },
      {
        onSuccess: (pedido) => {
          vaciar();
          router.push(rutaConfirmacionPedido(pedido, unidades, nombreServicio));
        },
        onError: (errorApi) => setError(errorParaMostrar(errorApi)),
      },
    );
  }

  /** Paso de pago: se aclara que es simulado antes de registrar el pedido. */
  function confirmarPago() {
    const total = desglose ? ` por ${formatearPrecio(desglose.total)}` : '';
    Alert.alert(
      'Pago simulado',
      `Esta app no cobra pagos reales: el pago es simulado. Se registrará tu pedido${total}. ¿Quieres confirmar la compra?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar compra', onPress: registrar },
      ],
    );
  }

  return (
    <View className="mb-bloque">
      {error ? (
        <AvisoErrorAccion
          titulo={error.titulo}
          mensaje={error.mensaje}
          sinConexion={error.sinConexion}
          onReintentar={error.reintentable ? registrar : undefined}
          reintentando={comprar.isPending}
        />
      ) : null}

      <Boton
        texto="Confirmar pedido"
        icono="check-circle"
        onPress={confirmarPago}
        cargando={comprar.isPending}
        deshabilitado={lineas.length === 0}
      />
    </View>
  );
}
