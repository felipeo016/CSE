import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LineaCarrito, ResultadoCarrito, ServicioCarrito } from '../models/Carrito';
import { mensajeInventario } from '../utils/validaciones';

/**
 * Store del carrito (RF-10, RF-11). Es estado local compartido entre Catálogo, Detalle de producto
 * y Carrito: al agregar desde el detalle, la pestaña Carrito se actualiza de inmediato.
 * Se persiste en AsyncStorage para que el carrito siga ahí al cerrar y reabrir la app.
 * Se vacía al cerrar sesión (sesionStore.cerrarSesion).
 */
interface CarritoState {
  lineas: LineaCarrito[];
  /** Servicio pedido con la compra (instalación o mantenimiento); null = sin servicio. */
  servicio: ServicioCarrito;

  /**
   * Agrega un producto. Si ya estaba, suma la cantidad. Nunca pasa del inventario:
   * si no cabe devuelve "Solo hay N unidades disponibles" y no cambia nada.
   */
  agregar: (linea: LineaCarrito) => ResultadoCarrito;
  /** Cambia la cantidad de una línea (entero entre 1 y su inventario). */
  cambiarCantidad: (productoId: string, cantidad: number) => ResultadoCarrito;
  /** Quita la línea completa (el botón − no baja de 1; para quitar se usa Eliminar). */
  eliminar: (productoId: string) => void;
  elegirServicio: (servicio: ServicioCarrito) => void;
  /** Deja el carrito vacío (al cerrar sesión y, en J6, tras confirmar la compra). */
  vaciar: () => void;
}

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set, get) => ({
      lineas: [],
      servicio: null,

      agregar: (nueva) => {
        const existente = get().lineas.find((linea) => linea.productoId === nueva.productoId);
        const cantidadFinal = (existente?.cantidad ?? 0) + nueva.cantidad;

        if (nueva.inventario <= 0) {
          return { ok: false, mensaje: 'Agotado' };
        }
        if (!Number.isInteger(nueva.cantidad) || nueva.cantidad < 1) {
          return { ok: false, mensaje: 'La cantidad mínima es 1' };
        }
        if (cantidadFinal > nueva.inventario) {
          return { ok: false, mensaje: mensajeInventario(nueva.inventario) };
        }

        set((estado) => ({
          lineas: existente
            ? // Se actualizan precio e inventario con los datos más recientes del catálogo.
              estado.lineas.map((linea) =>
                linea.productoId === nueva.productoId ? { ...nueva, cantidad: cantidadFinal } : linea,
              )
            : [...estado.lineas, nueva],
        }));
        return { ok: true };
      },

      cambiarCantidad: (productoId, cantidad) => {
        const linea = get().lineas.find((actual) => actual.productoId === productoId);
        if (!linea) {
          return { ok: false, mensaje: 'Producto no encontrado' };
        }
        if (!Number.isInteger(cantidad) || cantidad < 1) {
          return { ok: false, mensaje: 'La cantidad mínima es 1' };
        }
        if (cantidad > linea.inventario) {
          return { ok: false, mensaje: mensajeInventario(linea.inventario) };
        }
        set((estado) => ({
          lineas: estado.lineas.map((actual) =>
            actual.productoId === productoId ? { ...actual, cantidad } : actual,
          ),
        }));
        return { ok: true };
      },

      eliminar: (productoId) =>
        set((estado) => ({
          lineas: estado.lineas.filter((linea) => linea.productoId !== productoId),
        })),

      elegirServicio: (servicio) => set({ servicio }),

      vaciar: () => set({ lineas: [], servicio: null }),
    }),
    {
      name: 'carrito',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo se guardan los datos; las acciones se crean de nuevo al abrir la app.
      partialize: (estado) => ({ lineas: estado.lineas, servicio: estado.servicio }),
    },
  ),
);

/**
 * Total de unidades del carrito (suma de cantidades), para el indicador de la pestaña (RF-11).
 * Se usa como selector: useCarritoStore(totalUnidades).
 */
export function totalUnidades(estado: Pick<CarritoState, 'lineas'>): number {
  return estado.lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
}
