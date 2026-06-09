import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePost } from '../../src/hooks/usePosts';
import { useUnlockPost } from '../../src/hooks/useUnlockPost';
import { useLocationStore } from '../../src/stores/locationStore';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { LoadingView, EmptyState } from '../../src/components/StateViews';
import { haversineDistanceMeters, formatDistance } from '../../src/utils/geo';
import { formatRelativeTime } from '../../src/utils/format';
import { UNLOCK_RADIUS_METERS } from '../../src/constants';
import { colors } from '../../src/theme/colors';
import { fontSize, radius, spacing } from '../../src/theme/layout';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const coords = useLocationStore((s) => s.coords);
  const { data: post, isLoading } = usePost(id ?? null);
  const unlock = useUnlockPost(post ?? null);

  if (isLoading) return <LoadingView label="読み込み中..." />;
  if (!post) {
    return (
      <EmptyState
        title="この投稿は表示できません"
        description="削除されたか、閲覧権限がない可能性があります。"
      />
    );
  }

  const distance = coords
    ? haversineDistanceMeters(
        { latitude: post.lat, longitude: post.lng },
        coords,
      )
    : null;
  const withinRadius =
    distance != null && distance <= UNLOCK_RADIUS_METERS;
  const isUnlocked = post.is_own || withinRadius;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imageWrap}>
        {isUnlocked && unlock.data ? (
          <Image source={{ uri: unlock.data }} style={styles.image} contentFit="cover" />
        ) : (
          <>
            <Image
              source={{ uri: post.blurred_url ?? undefined }}
              style={styles.image}
              contentFit="cover"
              blurRadius={post.blurred_url ? 0 : 20}
            />
            {!isUnlocked ? (
              <View style={styles.lockOverlay}>
                <Ionicons name="lock-closed" size={40} color={colors.white} />
                <Text style={styles.lockTitle}>現地で解放</Text>
                <Text style={styles.lockText}>
                  {distance != null
                    ? `この場所まで約 ${formatDistance(distance)}`
                    : '現在地を取得できません'}
                </Text>
                <Text style={styles.lockHint}>
                  投稿地点から {UNLOCK_RADIUS_METERS}m 以内で写真が解放されます
                </Text>
              </View>
            ) : unlock.isFetching ? (
              <View style={styles.lockOverlay}>
                <Ionicons name="lock-open" size={40} color={colors.success} />
                <Text style={styles.lockTitle}>解放中...</Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      <View style={styles.metaRow}>
        <Avatar uri={post.author.avatar_url} name={post.author.username} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>@{post.author.username}</Text>
          <Text style={styles.time}>{formatRelativeTime(post.created_at)}</Text>
        </View>
        {isUnlocked ? (
          <View style={styles.unlockedBadge}>
            <Ionicons name="lock-open" size={14} color={colors.success} />
            <Text style={styles.unlockedText}>
              {post.is_own ? '自分の投稿' : '解放済み'}
            </Text>
          </View>
        ) : null}
      </View>

      {post.place_name ? (
        <View style={styles.placeRow}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.place}>{post.place_name}</Text>
        </View>
      ) : null}

      <Button
        label="この投稿者のプロフィール"
        variant="secondary"
        onPress={() => router.push(`/user/${post.user_id}`)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  imageWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: { width: '100%', height: '100%' },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  lockTitle: { color: colors.white, fontSize: fontSize.lg, fontWeight: '800' },
  lockText: { color: colors.white, fontSize: fontSize.md },
  lockHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  username: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  time: { color: colors.textMuted, fontSize: fontSize.xs },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  unlockedText: { color: colors.success, fontSize: fontSize.xs, fontWeight: '700' },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  place: { color: colors.text, fontSize: fontSize.md },
});
