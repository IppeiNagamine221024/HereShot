import { create } from 'zustand';

interface ComposeDraft {
  photoUri: string | null;
  lat: number | null;
  lng: number | null;
  setDraft: (draft: { photoUri: string; lat: number; lng: number }) => void;
  clear: () => void;
}

/**
 * 撮影〜投稿の一時データ（要件 FR-POST-01/02）。
 * アプリ内カメラで撮った写真と撮影地点の座標のみを保持する。
 */
export const useComposeStore = create<ComposeDraft>((set) => ({
  photoUri: null,
  lat: null,
  lng: null,
  setDraft: (draft) => set(draft),
  clear: () => set({ photoUri: null, lat: null, lng: null }),
}));
