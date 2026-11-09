import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { usePermissionsStore } from '../presentation/store/usePermissionsStore';

export default function LoadingScreen() {
  const checkPermission = usePermissionsStore((state) => state.checkPermission);

  useEffect(() => {
    let isActive = true;

    void checkPermission().then((permission) => {
      if (isActive) {
        router.replace(permission?.granted ? '/map' : '/permissions');
      }
    });

    return () => {
      isActive = false;
    };
  }, [checkPermission]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#173f73" />
      <Text style={styles.message}>Comprobando permisos de ubicación...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  message: {
    color: '#173f73',
    fontSize: 16,
    textAlign: 'center',
  },
});
