import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Vuelve a pedir los datos cada vez que el usuario regresa a la pantalla (RF-20: "una cotización
 * nueva aparece al volver a la pantalla"). La primera vez no hace nada, porque la consulta ya se
 * está pidiendo al montar la pantalla; así no se pide dos veces.
 *
 * useFocusEffect se ejecuta al enfocar la pantalla (por ejemplo, al volver con atrás o al tocar
 * la pestaña). No abre suscripciones, por eso no hace falta limpieza.
 *
 * @param recargar función que pide los datos otra vez (por ejemplo, consulta.refetch).
 */
export function useRecargarAlVolver(recargar: () => unknown): void {
  const primeraVez = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) {
        primeraVez.current = false;
        return;
      }
      void recargar();
    }, [recargar]),
  );
}
