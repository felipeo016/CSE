import { Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Colors } from '../../constants/Colors';
import { imagenesPorId } from '../../data/registros';
import { useRegistros } from '../../hooks/useRegistros';

export default function Detalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { obtenerPorId } = useRegistros();
  const router = useRouter();
  const registro = obtenerPorId(id);

  if (!registro) {
    return (
      <View className="flex-1 items-center justify-center p-5">
        <Text className="text-lg font-semibold">Lugar no encontrado</Text>
      </View>
    );
  }

  const codigoMapa = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <style>html, body, #mapa { height: 100%; margin: 0; }</style>
      </head>
      <body>
        <div id="mapa"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const mapa = L.map('mapa').setView([${registro.latitud}, ${registro.longitud}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(mapa);
          // La vista previa muestra el lugar abierto en esta ficha.
          L.marker([${registro.latitud}, ${registro.longitud}])
            .addTo(mapa)
            .bindPopup(${JSON.stringify(registro.nombre)})
            .openPopup();
        </script>
      </body>
    </html>
  `;

  return (
    <View className="flex-1 p-5" style={{ backgroundColor: Colors.fondo }}>
      <Image source={imagenesPorId[registro.id]} className="h-52 w-full rounded-lg" resizeMode="cover" />
      <Text className="mt-5 text-2xl font-bold text-gray-800">{registro.nombre}</Text>
      <Text className="mt-2 text-base text-gray-700">{registro.descripcion}</Text>
      <Text className="mt-4 self-start rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
        {registro.categoria}
      </Text>
      <Text className="mt-6 text-lg font-bold text-slate-800">Ubicación</Text>
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/mapa',
            params: {
              nombre: registro.nombre,
              latitud: String(registro.latitud),
              longitud: String(registro.longitud),
            },
          })
        }
        className="mt-2 overflow-hidden rounded-xl border border-slate-200"
      >
        <View pointerEvents="none" className="h-44">
          <WebView source={{ html: codigoMapa }} className="flex-1" />
        </View>
        <Text className="bg-white p-3 text-center font-semibold text-slate-700">
          Toca el mapa para ampliarlo
        </Text>
      </Pressable>
    </View>
  );
}
