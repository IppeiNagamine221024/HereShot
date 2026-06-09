/**
 * 現地解放の半径（メートル）。
 * 要件 FR-VIEW-02 / FR-VIEW-04: 投稿地点から 50m 以内で写真本体を解放する。
 */
export const UNLOCK_RADIUS_METERS = 50;

/**
 * 位置情報の取得間隔（ミリ秒）。
 */
export const LOCATION_UPDATE_INTERVAL_MS = 5000;

/**
 * 位置情報の取得に必要な最小移動距離（メートル）。
 */
export const LOCATION_DISTANCE_INTERVAL_M = 5;

/**
 * Mapbox 検索のデバウンス時間（ミリ秒）。
 */
export const SEARCH_DEBOUNCE_MS = 350;

/**
 * 地図初期表示の中心（東京駅周辺）。実際にはユーザーの現在地で上書きされる。
 */
export const DEFAULT_REGION = {
  latitude: 35.681236,
  longitude: 139.767125,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
