import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSearchUsers, useToggleFollow } from '../../src/hooks/useSocial';
import { useDebouncedValue } from '../../src/hooks/useDebouncedValue';
import { Avatar } from '../../src/components/Avatar';
import { EmptyState } from '../../src/components/StateViews';
import { colors } from '../../src/theme/colors';
import { fontSize, radius, spacing } from '../../src/theme/layout';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);
  const { data: users, isFetching } = useSearchUsers(debounced);
  const toggleFollow = useToggleFollow();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ユーザー名で検索"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={users ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          debounced.trim().length >= 1 && !isFetching ? (
            <EmptyState title="ユーザーが見つかりません" />
          ) : (
            <EmptyState
              title="友達を探そう"
              description="ユーザー名を入力して検索してください。"
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/user/${item.id}`)}
          >
            <Avatar uri={item.avatar_url} name={item.username} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={styles.username}>@{item.username}</Text>
              {item.bio ? (
                <Text style={styles.bio} numberOfLines={1}>
                  {item.bio}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() =>
                toggleFollow.mutate({
                  targetId: item.id,
                  follow: !item.is_following,
                })
              }
              style={[
                styles.followBtn,
                item.is_following && styles.followingBtn,
              ]}
            >
              <Text
                style={[
                  styles.followText,
                  item.is_following && styles.followingText,
                ]}
              >
                {item.is_following ? 'フォロー中' : 'フォロー'}
              </Text>
            </Pressable>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  username: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  bio: { color: colors.textMuted, fontSize: fontSize.xs },
  followBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  followingBtn: { backgroundColor: colors.surface },
  followText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '700' },
  followingText: { color: colors.textMuted },
});
