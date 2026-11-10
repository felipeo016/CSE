import { useEffect, useState } from 'react';

/**
 * Devuelve el valor recibido, pero solo después de que deja de cambiar durante "ms" milisegundos.
 * Sirve para no pedir al servidor una búsqueda por cada letra: se busca cuando el usuario hace
 * una pausa al escribir.
 */
export function useRetraso<T>(valor: T, ms: number): T {
  const [valorRetrasado, setValorRetrasado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setValorRetrasado(valor), ms);
    // Limpieza: si el valor cambia antes de tiempo, se cancela el temporizador anterior.
    return () => clearTimeout(temporizador);
  }, [valor, ms]);

  return valorRetrasado;
}
