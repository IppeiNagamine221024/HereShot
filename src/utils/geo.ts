import { UNLOCK_RADIUS_METERS } from '../constants';

export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Haversine 公式により 2 点間の距離（メートル）を求める。
 * 要件 FR-VIEW-04: 50m 判定はクライアント側で Haversine 公式により行う。
 */
export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * 投稿地点から現在地が解放半径（50m）以内かどうかを判定する。
 * 要件 FR-VIEW-05/06: GPS 誤判定の救済 UI は設けず、ブレは仕様として許容する。
 */
export function isWithinUnlockRadius(
  post: LatLng,
  viewer: LatLng,
  radiusMeters: number = UNLOCK_RADIUS_METERS,
): boolean {
  return haversineDistanceMeters(post, viewer) <= radiusMeters;
}

/**
 * 距離を人間に読みやすい文字列へ整形する。
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
