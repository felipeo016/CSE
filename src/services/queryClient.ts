import { QueryClient, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

/**
 * Tiempos de caché de TanStack Query (RNF-03).
 * - staleTime: tiempo en que los datos se consideran "frescos". Mientras lo son, al volver a una
 *   pantalla ya visitada se muestran desde caché sin hacer otra petición.
 * - gcTime: tiempo que una respuesta sin usar se guarda en memoria antes de borrarla.
 * Cada hook (useProductos, useCotizaciones...) puede usar otros valores para su recurso.
 */
export const STALE_TIME_MS = 2 * 60 * 1000; // 2 minutos
export const GC_TIME_MS = 10 * 60 * 1000; // 10 minutos

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      retry: 1, // un reintento automático; después se muestra el error con el botón Reintentar
    },
    mutations: {
      // Los envíos (pedido, cotización, cita) no se repiten solos para no crear registros duplicados.
      // El usuario los repite con Reintentar cuando vuelve la conexión (RNF-08).
      retry: 0,
    },
  },
});

/**
 * Conecta el onlineManager de TanStack Query con NetInfo: cuando el teléfono pierde la conexión,
 * las consultas se pausan y se reanudan solas al volver la red (RNF-08).
 * NetInfo.addEventListener devuelve la función que cancela la suscripción, y TanStack la usa
 * como limpieza.
 */
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((estado) => {
    // isConnected es null mientras NetInfo aún no sabe el estado: en ese caso no se marca sin conexión.
    setOnline(estado.isConnected !== false);
  });
});
