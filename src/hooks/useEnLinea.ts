import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

/**
 * Indica si el teléfono tiene conexión. Lee el onlineManager de TanStack Query, que
 * src/services/queryClient.ts conecta con NetInfo. useSyncExternalStore se suscribe a sus
 * cambios y React quita la suscripción solo cuando el componente se desmonta.
 */
export function useEnLinea(): boolean {
  return useSyncExternalStore(
    (avisar) => onlineManager.subscribe(avisar), // subscribe devuelve la función de limpieza
    () => onlineManager.isOnline(),
  );
}
