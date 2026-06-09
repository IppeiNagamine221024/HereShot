import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useComposeStore } from '../src/stores/composeStore';
import { useCreatePost } from '../src/hooks/usePosts';
import { useMyProfile } from '../src/hooks/useProfile';
import { reverseGeocode } from '../src/lib/mapbox';
import { Button } from '../src/components/Button';
import { VISIBILITY_OPTIONS, type Visibility } from '../src/types/models';
import { colors } from '../src/theme/colors';
import { fontSize, radius, spacing } from '../src/theme/layout';

export default function ComposeScreen() {
  const router = useRouter();
  const { photoUri, lat, lng, clear } = useComposeStore();
  const { data: profile } = useMyProfile();
  const createPost = useCreatePost();

  const [placeName, setPlaceName] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('followers');

  useEffect(() => {
    if (profile?.default_visibility) setVisibility(profile.default_visibility);
  }, [profile?.default_visibility]);

  useEffect(() => {
    if (lat != null && lng != null) {
      reverseGeocode(lat, lng).then((name) => {
        if (name) setPlaceName((prev) => prev || name);
      });
    }
  }, [lat, lng]);

  if (!photoUri || lat == null || lng == null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>撮影データがありません。</Text>
        <Button label="カメラに戻る" onPress={() => router.replace('/camera')} />
      </View>
    );
  }

  const onPost = async () => {
    try {
      await createPost.mutateAsync({
        localUri: photoUri,
        lat,
        lng,
        placeName: placeName.trim() || null,
        visibility,
      });
      clear();
      router.dismissAll?.();
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('投稿に失敗しました', e?.message ?? '不明なエラー');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" />

      <View style={styles.field}>
        <Text style={styles.label}>場所名</Text>
        <View style={styles.inputRow}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <TextInput
            value={placeName}
            onChangeText={setPlaceName}
            placeholder="場所名を入力（自動取得を編集できます）"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>公開範囲</Text>
        {VISIBILITY_OPTIONS.map((opt) => {
          const selected = opt.value === visibility;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setVisibility(opt.value)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selected ? colors.primary : colors.textFaint}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button
        label="この場所に投稿する"
        onPress={onPost}
        loading={createPost.isPending}
      />
      <Button label="撮り直す" variant="ghost" onPress={() => router.replace('/camera')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  empty: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  emptyText: { color: colors.text, fontSize: fontSize.md },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  field: { gap: spacing.sm },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: { borderColor: colors.primary },
  optionLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  optionDesc: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
});
