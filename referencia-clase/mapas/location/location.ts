import * as Location from 'expo-location';
import type { LocationData } from '../infrastructure/interfaces/location';
import { checkLocationPermission } from './permissions/location';

export async function getCurrentLocation(): Promise<LocationData> {
  const permission = await checkLocationPermission();
  if (!permission.granted) {
    throw new Error('Se necesita permiso de ubicación para obtener la posición actual.');
  }

  const result = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: result.coords.latitude,
    longitude: result.coords.longitude,
    accuracy: result.coords.accuracy,
    timestamp: result.timestamp,
  };
}
