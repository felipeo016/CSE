import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Usuario } from '../models/Usuario';
import { queryClient } from '../services/queryClient';

/**
 * Store de la sesión (RF-04). Guarda solo el estado local de la sesión; las peticiones a Supabase
 * las hace src/services/auth.service.ts, que llama a estas acciones con la respuesta del servidor.
 * Se persiste en AsyncStorage para que la sesión siga abierta al cerrar y reabrir la app.
 */
interface SesionState {
  /** access_token del usuario; va en el header Authorization (lo agrega api.ts). */
  token: string | null;
  /** Sirve para pedir un token nuevo cuando el actual vence. */
  refreshToken: string | null;
  usuario: Usuario | null;
  /** true cuando AsyncStorage ya devolvió la sesión guardada (antes no se sabe si hay sesión). */
  hidratado: boolean;

  /** Guarda la sesión recién abierta (login o registro). */
  abrirSesion: (datos: { token: string; refreshToken: string; usuario: Usuario }) => void;
  /** Reemplaza los tokens después de renovarlos con el refresh token. */
  actualizarTokens: (token: string, refreshToken: string) => void;
  /** Actualiza los datos del usuario (por ejemplo, tras editar el Perfil). */
  actualizarUsuario: (usuario: Usuario) => void;
  /** Borra la sesión del dispositivo: token, datos del usuario, carrito y caché de consultas. */
  cerrarSesion: () => void;
}

export const useSesionStore = create<SesionState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      usuario: null,
      hidratado: false,

      abrirSesion: ({ token, refreshToken, usuario }) => set({ token, refreshToken, usuario }),

      actualizarTokens: (token, refreshToken) => set({ token, refreshToken }),

      actualizarUsuario: (usuario) => set({ usuario }),

      cerrarSesion: () => {
        set({ token: null, refreshToken: null, usuario: null });
        // Los datos del servidor del usuario anterior no deben verse con otra cuenta.
        queryClient.clear();
        // PENDIENTE J3: vaciar aquí el carrito (carritoStore aún no existe).
      },
    }),
    {
      name: 'sesion',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo se guardan los datos de la sesión; "hidratado" y las acciones no.
      partialize: (estado) => ({
        token: estado.token,
        refreshToken: estado.refreshToken,
        usuario: estado.usuario,
      }),
      // Se llama cuando termina de leer AsyncStorage (con o sin sesión guardada, o con error).
      onRehydrateStorage: () => () => {
        useSesionStore.setState({ hidratado: true });
      },
    },
  ),
);
