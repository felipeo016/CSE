import type { Rol, Usuario } from '../models/Usuario';
import { useSesionStore } from '../store/sesionStore';

/**
 * Resultado de revisar el acceso a una pantalla:
 * - 'cargando': AsyncStorage todavía no devuelve la sesión guardada.
 * - 'sin-sesion': no hay usuario; se debe ir a Iniciar sesión.
 * - 'no-autorizado': hay usuario, pero su rol no puede abrir la pantalla.
 * - 'autorizado': puede verla.
 */
export type EstadoAcceso = 'cargando' | 'sin-sesion' | 'no-autorizado' | 'autorizado';

/**
 * Hook propio de protección por rol (RF-03, RF-34, RNF-05). Lee la sesión del sesionStore (Zustand)
 * y dice si el usuario puede abrir una pantalla. Lo usa el componente RutaProtegida.
 * Funciona igual si la pantalla se abre desde un botón o escribiendo la ruta (enlace profundo).
 */
export function useRequiereRol(rolesPermitidos: readonly Rol[]): {
  estado: EstadoAcceso;
  usuario: Usuario | null;
} {
  const hidratado = useSesionStore((estado) => estado.hidratado);
  const token = useSesionStore((estado) => estado.token);
  const usuario = useSesionStore((estado) => estado.usuario);

  if (!hidratado) {
    return { estado: 'cargando', usuario: null };
  }
  if (!token || !usuario) {
    return { estado: 'sin-sesion', usuario: null };
  }
  if (!rolesPermitidos.includes(usuario.rol)) {
    return { estado: 'no-autorizado', usuario };
  }
  return { estado: 'autorizado', usuario };
}
