import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useComposeStore } from '../src/stores/composeStore';
import { useLocationStore } from '../src/stores/locationStore';
import { Button } from '../src/components/Button';
import { colors } from '../src/theme/colors';
import { fontSize, spacing } from '../src/theme/layout';

/**
 * アプリ内カメラ（要件 FR-POST-01）。カメラロールは使用しない。
 * 撮影と同時に現在地（撮影地点）を記録する（FR-POST-02）。
 *
 * ルート名は /capture（(tabs)/camera タブスロットとの衝突を避ける）。
 */
export default function CaptureScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const coords = useLocationStore((s) => s.coords);
  const locationGranted = useLocationStore((s) => s.granted);
  const setDraft = useComposeStore((s) => s.setDraft);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const onCapture = async () => {
    if (!cameraRef.current || capturing || !coords) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo?.uri) return;
      setDraft({ photoUri: photo.uri, lat: coords.latitude, lng: coords.longitude });
      router.replace('/compose');
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.permission}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.permissionText}>カメラを準備しています...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permission}>
        <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
        <Text style={styles.permissionText}>
          写真を撮るにはカメラの許可が必要です。
        </Text>
        <Button label="カメラを許可" onPress={requestPermission} />
        <Button label="閉じる" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="picture"
        active
        onCameraReady={() => setCameraReady(true)}
      />

      {!cameraReady ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.white} size="large" />
        </View>
      ) : null}

      <SafeAreaView style={styles.topBar} edges={['top']}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={26} color={colors.white} />
        </Pressable>
        <Pressable
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          style={styles.iconBtn}
        >
          <Ionicons name="camera-reverse" size={26} color={colors.white} />
        </Pressable>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        {!locationGranted ? (
          <Text style={styles.warning}>
            位置情報が許可されていません。設定から許可してください。
          </Text>
        ) : !coords ? (
          <Text style={styles.warning}>現在地を取得しています...</Text>
        ) : null}
        <Pressable
          onPress={onCapture}
          disabled={!coords || capturing || !cameraReady}
          style={[styles.shutter, (!coords || capturing || !cameraReady) && styles.shutterDisabled]}
        >
          {capturing ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  camera: { flex: 1, width: '100%' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permission: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  permissionText: {
    color: colors.text,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  warning: {
    color: colors.warning,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    fontSize: fontSize.sm,
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  shutterDisabled: { opacity: 0.5 },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
  },
});
