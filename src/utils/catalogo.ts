import type { Categoria, Marca, ProductoSegunRol } from '../models/Producto';
import { normalizarTexto } from './texto';

/** Criterios del catálogo: texto buscado y filtros (null = "Todas"). */
export interface CriteriosCatalogo {
  texto: string;
  categoria: Categoria | null;
  marca: Marca | null;
}

/**
 * Filtra el catálogo ya cargado, sin pedir nada al servidor (RF-06, RF-07, RNF-03).
 * La búsqueda mira el nombre y el código sin distinguir mayúsculas ni tildes; los productos sin
 * código se encuentran por nombre. Búsqueda, categoría y marca se combinan (deben cumplirse todas).
 */
export function filtrarProductos<T extends ProductoSegunRol>(
  productos: readonly T[],
  { texto, categoria, marca }: CriteriosCatalogo,
): T[] {
  const buscado = normalizarTexto(texto);
  return productos.filter((producto) => {
    const coincideTexto =
      buscado === '' ||
      normalizarTexto(producto.nombre).includes(buscado) ||
      normalizarTexto(producto.codigo ?? '').includes(buscado);
    const coincideCategoria = categoria === null || producto.categoria === categoria;
    const coincideMarca = marca === null || producto.marca === marca;
    return coincideTexto && coincideCategoria && coincideMarca;
  });
}
