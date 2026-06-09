import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PlaceSearchBar } from '../../src/components/PlaceSearchBar';
import { usePostsInBbox } from '../../src/hooks/usePosts';
import { useLocationStore } from '../../src/stores/locationStore';
import { useDebouncedValue } from '../../src/hooks/useDebouncedValue';
import { isWithinUnlockRadius } from '../../src/utils/geo';
import { DEFAULT_REGION } from '../../src/constants';
import { colors } from '../../src/theme/colors';
import type { BoundingBox } from '../../src/types/models';

export default function HomeMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const coords = useLocationStore((s) => s.coords);

  const initialRegion: Region = useMemo(
    () =>
      coords
        ? {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }
        : DEFAULT_REGION,
    // 初期表示のみ。以降のユーザー操作で上書きされる。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [region, setRegion] = useState<Region>(initialRegion);
  const debouncedRegion = useDebouncedValue(region, 400);

  const bbox: BoundingBox = useMemo(
    () => ({
      minLat: debouncedRegion.latitude - debouncedRegion.latitudeDelta / 2,
      maxLat: debouncedRegion.latitude + debouncedRegion.latitudeDelta / 2,
      minLng: debouncedRegion.longitude - debouncedRegion.longitudeDelta / 2,
      maxLng: debouncedRegion.longitude + debouncedRegion.longitudeDelta / 2,
    }),
    [debouncedRegion],
  );

  const { data: posts } = usePostsInBbox(bbox);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle="dark"
      >
        {(posts ?? []).map((post) => {
          const unlocked =
            post.is_own ||
            (!!coords &&
              isWithinUnlockRadius(
                { latitude: post.lat, longitude: post.lng },
                coords,
              ));
          return (
            <Marker
              key={post.id}
              coordinate={{ latitude: post.lat, longitude: post.lng }}
              onPress={() => router.push(`/post/${post.id}`)}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.pin,
                  { backgroundColor: unlocked ? colors.success : colors.locked },
                ]}
              >
                <Ionicons
                  name={unlocked ? 'image' : 'lock-closed'}
                  size={16}
                  color={colors.white}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView edges={['top']} style={styles.searchOverlay} pointerEvents="box-none">
        <PlaceSearchBar
          onSelect={(place) => {
            mapRef.current?.animateToRegion(
              {
                latitude: place.latitude,
                longitude: place.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              },
              500,
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
});
