import OpenStreetMap from './OpenStreetMap';
import type { LatLng } from '../../../../infrastructure/interfaces/lat-lng';

interface MapMarker extends LatLng {
  title: string;
  description?: string;
}

interface CustomMapProps {
  center: LatLng;
  markers: MapMarker[];
}

export default function CustomMap({ center, markers }: CustomMapProps) {
  return <OpenStreetMap center={center} markers={markers} />;
}
