import type { Cliente } from '../models/Cliente';
import { normalizarTexto } from './texto';

/**
 * Filtra los clientes por nombre o teléfono (RF-33), sin distinguir mayúsculas ni tildes:
 * "Gomez" encuentra "Gómez". En el teléfono se buscan los dígitos sin espacios, porque así se
 * guardan ("300 123" encuentra 3001234567). Sin texto devuelve la lista completa.
 */
export function filtrarClientes(clientes: Cliente[], busqueda: string): Cliente[] {
  const texto = normalizarTexto(busqueda);
  if (texto === '') {
    return clientes;
  }
  const digitos = texto.replace(/\s/g, '');
  const buscarTelefono = /^\d+$/.test(digitos);
  return clientes.filter(
    (cliente) =>
      normalizarTexto(cliente.nombre).includes(texto) ||
      (buscarTelefono && (cliente.telefono ?? '').includes(digitos)),
  );
}
