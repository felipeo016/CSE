import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import CustomMap from '../presentation/components/maps/CustomMap';
import { useLocationStore } from '../presentation/store/useLocationStore';
import { usePermissionsStore } from '../presentation/store/usePermissionsStore';

const DOSQUEBRADAS = { latitude: 4.834, longitude: -75.676 };
const PEREIRA = { latitude: 4.813, longitude: -75.696 };

export default function MapScreen() {
  const location = useLocationStore((state) => state.location);
  const locationError = useLocationStore((state) => state.error);
  const isLoadingLocation = useLocationStore((state) => state.isLoading);
  const loadCurrentLocation = useLocationStore((state) => state.loadCurrentLocation);
  const checkPermission = usePermissionsStore((state) => state.checkPermission);

  useEffect(() => {
    let isActive = true;

    void checkPermission().then((permission) => {
      if (!isActive) {
        return;
      }

      if (permission?.granted) {
        void loadCurrentLocation();
      }
    });

    return () => {
      isActive = false;
    };
  }, [checkPermission, loadCurrentLocation]);

  return (
    <View style={styles.container}>
      <CustomMap
        center={location ?? DOSQUEBRADAS}
        markers={[
          { ...PEREIRA, title: 'Pereira', description: 'Punto de referencia de Pereira, Risaralda' },
          { ...DOSQUEBRADAS, title: 'Dosquebradas', description: 'Punto de referencia de Dosquebradas, Risaralda' },
        ]}
      />
      <View style={styles.banner}>
        <Text style={styles.title}>Pereira y Dosquebradas</Text>
        {location ? (
          <Text style={styles.message}>
            Ubicación actual: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={styles.message}>El mapa muestra Pereira y Dosquebradas.</Text>
        )}
        {isLoadingLocation && <ActivityIndicator color="#173f73" />}
        {locationError && <Text style={styles.error}>{locationError}</Text>}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/permissions')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Permisos de ubicación</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    top: 16,
    left: 12,
    right: 12,
    gap: 8,
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 10,
  },
  title: {
    color: '#173f73',
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    color: '#333',
  },
  error: {
    color: '#b42318',
  },
  button: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#173f73',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
