import { create } from 'zustand';
import { getCurrentLocation } from '../../../location/location';
import type { LocationData } from '../../../infrastructure/interfaces/location';

interface LocationState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  loadCurrentLocation: () => Promise<LocationData | null>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo obtener la ubicación.';
}

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  isLoading: false,
  error: null,
  loadCurrentLocation: async () => {
    set({ isLoading: true, error: null });

    try {
      const location = await getCurrentLocation();
      set({ location });
      return location;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));
