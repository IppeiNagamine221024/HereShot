const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export interface PlaceResult {
  id: string;
  name: string;
  fullName: string;
  latitude: number;
  longitude: number;
}

/**
 * Mapbox Geocoding API による場所検索（要件 FR-MAP-04）。
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const q = query.trim();
  if (!q) return [];
  if (!MAPBOX_TOKEN) {
    console.warn('[mapbox] EXPO_PUBLIC_MAPBOX_TOKEN が未設定です。');
    return [];
  }

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?access_token=${MAPBOX_TOKEN}&limit=6&language=ja`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mapbox 検索に失敗しました (${res.status})`);
  }
  const json = (await res.json()) as {
    features: {
      id: string;
      text: string;
      place_name: string;
      center: [number, number];
    }[];
  };

  return (json.features ?? []).map((f) => ({
    id: f.id,
    name: f.text,
    fullName: f.place_name,
    longitude: f.center[0],
    latitude: f.center[1],
  }));
}

/**
 * 座標から場所名を取得する逆ジオコーディング（要件 FR-POST-05）。
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json` +
    `?access_token=${MAPBOX_TOKEN}&limit=1&language=ja`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      features: { place_name: string; text: string }[];
    };
    return json.features?.[0]?.text ?? json.features?.[0]?.place_name ?? null;
  } catch {
    return null;
  }
}
