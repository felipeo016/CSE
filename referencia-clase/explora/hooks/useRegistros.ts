import { useMemo, useState } from 'react';
import { registros } from '../data/registros';

export function useRegistros() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const categorias = Array.from(new Set(registros.map((registro) => registro.categoria)));

  const registrosFiltrados = useMemo(() => {
    const textoBuscado = busqueda.trim().toLowerCase();

    // Ambos filtros se aplican sobre los mismos registros del catálogo.
    return registros.filter(
      (registro) =>
        registro.nombre.toLowerCase().includes(textoBuscado) &&
        (!categoriaSeleccionada || registro.categoria === categoriaSeleccionada)
    );
  }, [busqueda, categoriaSeleccionada]);

  // Consulta un lugar a partir del identificador recibido en la ruta.
  const obtenerPorId = (id: string) => registros.find((registro) => registro.id === id);

  return {
    registros,
    registrosFiltrados,
    busqueda,
    setBusqueda,
    categorias,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    obtenerPorId,
  };
}
