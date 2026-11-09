import * as Location from 'expo-location';

export function checkLocationPermission() {
  return Location.getForegroundPermissionsAsync();
}

export function requestLocationPermission() {
  return Location.requestForegroundPermissionsAsync();
}
