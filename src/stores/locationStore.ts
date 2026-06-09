import { create } from 'zustand';
import type { LatLng } from '../utils/geo';

interface LocationState {
  coords: LatLng | null;
  granted: boolean;
  setCoords: (coords: LatLng) => void;
  setGranted: (granted: boolean) => void;
}

/**
 * ユーザーの現在地を保持するグローバルストア。
 * 50m 判定（現地解放）に利用する。投稿者の位置はサーバーへ送らない（要件 5.3）。
 */
export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  granted: false,
  setCoords: (coords) => set({ coords }),
  setGranted: (granted) => set({ granted }),
}));
