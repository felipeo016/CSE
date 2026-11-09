import type { LatLng } from './lat-lng';

export interface LocationData extends LatLng {
  accuracy: number | null;
  timestamp: number;
}
