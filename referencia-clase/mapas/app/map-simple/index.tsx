import { View, StyleSheet, Text } from 'react-native';
import OpenStreetMap from '@/presentation/components/maps/OpenStreetMap';

// Coordenadas iniciales de la práctica: Pereira, Risaralda.
const PEREIRA = { latitude: 4.813, longitude: -75.744805 };
const IBAGUE = { latitude: 4.44751, longitude: -75.180302 };


export default function MapScreen() {
  return (
    <View style={styles.container}>
      <OpenStreetMap
        staticMode
        center={PEREIRA}
        markers={[
          { ...PEREIRA, title: 'Pereira', description: 'Punto inicial de la práctica' },
          { ...IBAGUE, title: 'Ibagué', description: 'Punto de referencia de Ibagué, Tolima' },
        ]}
      />
      <View style={styles.banner}>
        <Text style={styles.title}>Mapa fijo: Pereira y Ibagué</Text>
        <Text>Pereira: {PEREIRA.latitude.toFixed(3)}, {PEREIRA.longitude.toFixed(3)}</Text>
        <Text>Ibagué: {IBAGUE.latitude.toFixed(3)}, {IBAGUE.longitude.toFixed(3)}</Text>
        <Text style={styles.note}>Coordenadas de ejemplo, no del GPS. Toca los marcadores.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: { 
    position: 'absolute', 
    top: 16, 
    left: 12, 
    right: 12, 
    padding: 12, 
    backgroundColor: 'white', 
    borderRadius: 10, 
    elevation: 10 
  },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: '#173f73' },
  note: { marginTop: 5, color: '#444' },
});