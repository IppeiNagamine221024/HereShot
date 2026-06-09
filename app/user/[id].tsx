import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useProfile } from '../../src/hooks/useProfile';
import { useMyPosts } from '../../src/hooks/usePosts';
import {
  useFollowState,
  useFollowCounts,
  useToggleFollow,
  useToggleBlock,
} from '../../src/hooks/useSocial';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { PostGrid } from '../../src/components/PostGrid';
import { EmptyState, LoadingView } from '../../src/components/StateViews';
import { colors } from '../../src/theme/colors';
import { fontSize, spacing } from '../../src/theme/layout';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profile, isLoading } = useProfile(id ?? null);
  const { data: posts } = useMyPosts(id ?? null);
  const { data: followState } = useFollowState(id ?? null);
  const { data: counts } = useFollowCounts(id ?? null);
  const toggleFollow = useToggleFollow();
  const toggleBlock = useToggleBlock();

  if (isLoading) return <LoadingView />;
  if (!profile) {
    return <EmptyState title="ユーザーが見つかりません" />;
  }

  const isFollowing = followState?.isFollowing ?? false;

  const confirmBlock = () => {
    Alert.alert(
      'ブロック',
      `@${profile.username} をブロックしますか？お互いの投稿が非表示になります。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ブロック',
          style: 'destructive',
          onPress: () => toggleBlock.mutate({ targetId: profile.id, block: true }),
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: `@${profile.username}` }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar uri={profile.avatar_url} name={profile.username} size={72} />
          <View style={styles.headerInfo}>
            <Text style={styles.username}>@{profile.username}</Text>
            <View style={styles.stats}>
              <Stat label="投稿" value={posts?.length ?? 0} />
              <Stat label="フォロワー" value={counts?.followers ?? 0} />
              <Stat label="フォロー中" value={counts?.following ?? 0} />
            </View>
          </View>
        </View>

        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.actions}>
          <Button
            label={isFollowing ? 'フォロー中' : 'フォローする'}
            variant={isFollowing ? 'secondary' : 'primary'}
            loading={toggleFollow.isPending}
            style={{ flex: 1 }}
            onPress={() =>
              toggleFollow.mutate({ targetId: profile.id, follow: !isFollowing })
            }
          />
          <Button label="ブロック" variant="danger" onPress={confirmBlock} style={{ flex: 1 }} />
        </View>

        <Text style={styles.sectionTitle}>投稿</Text>
        {posts && posts.length > 0 ? (
          <PostGrid posts={posts} />
        ) : (
          <EmptyState
            title="表示できる投稿がありません"
            description="公開範囲やフォロー関係により表示されない場合があります。"
          />
        )}
      </ScrollView>
    </>
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
  actions: { flexDirection: 'row', gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
});
