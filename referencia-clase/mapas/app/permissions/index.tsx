import { View } from 'react-native';
import { ThemedText } from '@/presentation/components/shared/ThemeText';
import { usePermissionsStore } from '@/presentation/store/usePermissionsStore';
import ThemedPressable from '@/presentation/components/shared/ThemePressable';

const PermissionsScreen = () => {
  const { locationStatus, requestLocationPermission } = usePermissionsStore();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ThemedPressable onPress={requestLocationPermission}>
        Habilitar ubicación
      </ThemedPressable>

      <ThemedText>Estado actual: {locationStatus}</ThemedText>
    </View>
  );
};

export default PermissionsScreen;