import { create } from 'zustand';
import type { PermissionResponse } from 'expo';
import {
  checkLocationPermission,
  requestLocationPermission,
} from '../../../location/permissions/location';

interface PermissionsState {
  permission: PermissionResponse | null;
  isChecking: boolean;
  error: string | null;
  checkPermission: () => Promise<PermissionResponse | null>;
  requestPermission: () => Promise<PermissionResponse | null>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo comprobar el permiso de ubicación.';
}

export const usePermissionsStore = create<PermissionsState>((set) => ({
  permission: null,
  isChecking: false,
  error: null,
  checkPermission: async () => {
    set({ isChecking: true, error: null });

    try {
      const permission = await checkLocationPermission();
      set({ permission });
      return permission;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return null;
    } finally {
      set({ isChecking: false });
    }
  },
  requestPermission: async () => {
    set({ isChecking: true, error: null });

    try {
      const permission = await requestLocationPermission();
      set({ permission });
      return permission;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return null;
    } finally {
      set({ isChecking: false });
    }
  },
}));
