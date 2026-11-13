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

const RUTA_MIS_PEDIDOS = '/(cliente)/(drawer)/mis-pedidos';

/** Error de la última compra, ya listo para mostrar. */
interface ErrorCompra {
  titulo: string;
  mensaje: string;
  /** true si tiene sentido repetir la compra tal cual (sin conexión o falla del servidor). */
  reintentable: boolean;
  sinConexion: boolean;
  /** true si la compra anterior ya quedó registrada: se ofrece ir a Mis pedidos. */
  irAMisPedidos: boolean;
}

// Sin conexión o sin respuesta a tiempo: la compra pudo quedar registrada o no, así que no se
// afirma ninguna de las dos cosas. Reintentar es seguro porque repite el mismo identificador.
const ERROR_SIN_CONEXION: ErrorCompra = {
  titulo: 'No se pudo confirmar la compra',
  mensaje:
    'No pudimos confirmar tu compra con el servidor. Revisa tu conexión y pulsa Reintentar: es seguro, tu compra no se registrará dos veces.',
  reintentable: true,
  sinConexion: true,
  irAMisPedidos: false,
};

/** Traduce el error del servidor a lo que ve el cliente (hints de docs/servicio-remoto.md). */
function errorParaMostrar(error: ErrorApi): ErrorCompra {
  if (error.tipo === 'sin_conexion') {
    return ERROR_SIN_CONEXION;
  }
  if (error.codigo === 'COMPRA_YA_REGISTRADA') {
    // El mensaje del servidor trae el número: "Tu compra anterior ya quedó registrada como PED-…".
    return {
      titulo: 'Tu compra ya estaba registrada',
      mensaje: error.mensaje,
      reintentable: false,
      sinConexion: false,
      irAMisPedidos: true,
    };
  }
  if (error.codigo === 'INVENTARIO_INSUFICIENTE') {
    // El mensaje del servidor ya trae producto y unidades: "Solo hay 2 unidades disponibles de X".
    return {
      titulo: 'No hay inventario suficiente',
      mensaje: `${error.mensaje.replace(/\.$/, '')}. No se registró el pedido: ajusta la cantidad o quita el producto.`,
      reintentable: false,
      sinConexion: false,
      irAMisPedidos: false,
    };
  }
  return {
    titulo: 'No se pudo registrar el pedido',
    mensaje: `${error.mensaje.replace(/\.$/, '')}. Tu carrito sigue igual.`,
    reintentable: error.tipo === 'servidor',
    sinConexion: false,
    irAMisPedidos: false,
  };
}

/**
 * Confirmar pedido del carrito (RF-13). Primero un paso que dice "Pago simulado" (no hay pasarela
 * de pago real); luego la RPC registrar_pedido_carrito.
 * - Si sale bien: se vacía el carrito y se va a la Confirmación de pedido con el número y el total
 *   que devolvió el servidor (useRegistrarPedidoCarrito ya invalidó productos y pedidos).
 * - Si falta inventario: se muestra el producto y las unidades disponibles y no se registra nada.
 * - Sin conexión o sin respuesta: no se confirma, el carrito se conserva y se ofrece Reintentar
 *   (RNF-08). Reintentar envía el mismo identificador de compra, así que no se duplica el pedido.
 * - Si la compra anterior ya quedó registrada y el carrito cambió (COMPRA_YA_REGISTRADA): se
 *   muestra el número del pedido, se ofrece ir a Mis pedidos y el carrito se conserva.
 */
export default function ConfirmarCompraCarrito({ lineas, servicio }: ConfirmarCompraCarritoProps) {
  const comprar = useRegistrarPedidoCarrito();
  const enLinea = useEnLinea();
  const vaciar = useCarritoStore((estado) => estado.vaciar);
  // Mismo hook que el resumen: el total que se muestra en el paso de pago es el del resumen.
  const { desglose } = useCalculoTotal({ lineas, servicio });
  // Identificador de la compra en curso (migración 008). Vive en carritoStore, que se guarda en
  // AsyncStorage: sigue ahí aunque el cliente cierre la app después de una demora. Se crea en el
  // primer intento, se repite en cada Reintentar (aunque el carrito cambie) y se renueva solo
  // tras una compra exitosa (vaciar), tras COMPRA_YA_REGISTRADA o al cerrar sesión.
  const obtenerCompraId = useCarritoStore((estado) => estado.obtenerCompraId);
  const renovarCompraId = useCarritoStore((estado) => estado.renovarCompraId);
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
        compraId: obtenerCompraId(),
      },
      {
        onSuccess: (pedido) => {
          vaciar(); // también renueva el identificador: la próxima compra lleva uno nuevo
          router.push(rutaConfirmacionPedido(pedido, unidades, nombreServicio));
        },
        onError: (errorApi) => {
          // Esa compra ya terminó (quedó registrada): la próxima lleva un identificador nuevo.
          if (errorApi.codigo === 'COMPRA_YA_REGISTRADA') {
            renovarCompraId();
          }
          setError(errorParaMostrar(errorApi));
        },
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
      {error?.irAMisPedidos ? (
        <View className="mb-bloque">
          <Boton
            texto="Ir a Mis pedidos"
            icono="shopping-bag"
            variante="secundario"
            onPress={() => router.navigate(RUTA_MIS_PEDIDOS)}
          />
        </View>
      ) : null}

      <Boton
        texto="Confirmar pedido"
        icono="check-circle"
        onPress={confirmarPago}
        cargando={comprar.isPending}
        // Sin total calculado (tarifas cargando o con error) no se puede confirmar la compra.
        deshabilitado={lineas.length === 0 || !desglose}
      />
    </View>
  );
}
