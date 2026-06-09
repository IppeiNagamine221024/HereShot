import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyProfile } from '../../src/hooks/useProfile';
import { useMyPosts } from '../../src/hooks/usePosts';
import { useFollowCounts } from '../../src/hooks/useSocial';
import { useAuth } from '../../src/providers/AuthProvider';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { PostGrid } from '../../src/components/PostGrid';
import { EmptyState, LoadingView } from '../../src/components/StateViews';
import { colors } from '../../src/theme/colors';
import { fontSize, spacing } from '../../src/theme/layout';

export default function ProfileScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: profile, isLoading } = useMyProfile();
  const { data: posts } = useMyPosts();
  const { data: counts } = useFollowCounts(userId);

  if (isLoading) return <LoadingView />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar uri={profile?.avatar_url} name={profile?.username} size={72} />
          <View style={styles.headerInfo}>
            <Text style={styles.username}>@{profile?.username ?? '...'}</Text>
            <View style={styles.stats}>
              <Stat label="投稿" value={posts?.length ?? 0} />
              <Stat label="フォロワー" value={counts?.followers ?? 0} />
              <Stat label="フォロー中" value={counts?.following ?? 0} />
            </View>
          </View>
        </View>

        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <Button
          label="プロフィールを編集"
          variant="secondary"
          onPress={() => router.push('/settings/edit-profile')}
        />

        <Text style={styles.sectionTitle}>マイマップ</Text>
        {posts && posts.length > 0 ? (
          <PostGrid posts={posts} />
        ) : (
          <EmptyState
            title="まだ投稿がありません"
            description="中央のカメラから、今いる場所で1枚撮ってみよう。"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headerInfo: { flex: 1, gap: spacing.sm },
  username: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: spacing.xl },
  stat: { alignItems: 'center' },
  statValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  bio: { color: colors.textMuted, fontSize: fontSize.md, lineHeight: 22 },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
});
