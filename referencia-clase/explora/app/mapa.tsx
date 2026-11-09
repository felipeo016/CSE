import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Colors } from '../constants/Colors';

function esCoordenadaValida(valor: string | undefined, limite: number) {
  const numero = Number(valor);
  return Number.isFinite(numero) && Math.abs(numero) <= limite;
}

export default function Mapa() {
  const { latitud, longitud, nombre } = useLocalSearchParams<{
    latitud?: string;
    longitud?: string;
    nombre?: string;
  }>();

  const datosValidos =
    esCoordenadaValida(latitud, 90) &&
    esCoordenadaValida(longitud, 180) &&
    Boolean(nombre);

  if (!datosValidos) {
    return (
      <View
        className="flex-1 items-center justify-center p-5"
        style={{ backgroundColor: Colors.fondo }}
      >
        <Text className="text-center text-lg font-semibold text-slate-800">
          No se pudo mostrar la ubicación del lugar.
        </Text>
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
          const mapa = L.map('mapa').setView([${Number(latitud)}, ${Number(longitud)}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(mapa);
          // El marcador y su mensaje corresponden al lugar seleccionado.
          L.marker([${Number(latitud)}, ${Number(longitud)}])
            .addTo(mapa)
            .bindPopup(${JSON.stringify(nombre)})
            .openPopup();
        </script>
      </body>
    </html>
  `;

  return <WebView source={{ html: codigoMapa }} className="flex-1" />;
}
