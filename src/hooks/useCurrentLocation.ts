import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '../stores/locationStore';
import {
  LOCATION_DISTANCE_INTERVAL_M,
  LOCATION_UPDATE_INTERVAL_MS,
} from '../constants';

/**
 * 位置情報の権限取得と現在地の購読を行う。
 * 要件 5.3: 使用中のみ取得（When In Use）。救済 UI は設けない（FR-VIEW-05）。
 */
export function useCurrentLocation(): void {
  const setCoords = useLocationStore((s) => s.setCoords);
  const setGranted = useLocationStore((s) => s.setGranted);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      const granted = status === 'granted';
      setGranted(granted);
      if (!granted) return;

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (cancelled) return;
      setCoords({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_UPDATE_INTERVAL_MS,
          distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
        },
        (loc) => {
          setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        },
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [setCoords, setGranted]);
}
