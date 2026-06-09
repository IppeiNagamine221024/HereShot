import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMyProfile, useUpdateProfile } from '../../src/hooks/useProfile';
import { useBlocks, useToggleBlock } from '../../src/hooks/useSocial';
import { Avatar } from '../../src/components/Avatar';
import { LoadingView } from '../../src/components/StateViews';
import { VISIBILITY_OPTIONS, type Visibility } from '../../src/types/models';
import { colors } from '../../src/theme/colors';
import { fontSize, radius, spacing } from '../../src/theme/layout';

export default function PrivacyScreen() {
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const { data: blocks } = useBlocks();
  const toggleBlock = useToggleBlock();

  if (isLoading) return <LoadingView />;

  const current: Visibility = profile?.default_visibility ?? 'followers';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>デフォルト公開範囲</Text>
        <Text style={styles.sectionDesc}>
          新規投稿に適用される初期値です（投稿ごとに変更できます）。
        </Text>
        <View style={styles.card}>
          {VISIBILITY_OPTIONS.map((opt) => {
            const selected = opt.value === current;
            return (
              <Pressable
                key={opt.value}
                style={styles.row}
                onPress={() =>
                  updateProfile.mutate({ default_visibility: opt.value })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{opt.label}</Text>
                  <Text style={styles.rowDesc}>{opt.description}</Text>
                </View>
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected ? colors.primary : colors.textFaint}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ブロック中のユーザー</Text>
        <View style={styles.card}>
          {blocks && blocks.length > 0 ? (
            blocks.map((u) => (
              <View key={u.id} style={styles.row}>
                <Avatar uri={u.avatar_url} name={u.username} size={40} />
                <Text style={[styles.rowLabel, { flex: 1 }]}>@{u.username}</Text>
                <Pressable
                  onPress={() =>
                    Alert.alert('ブロック解除', `@${u.username} のブロックを解除しますか？`, [
                      { text: 'キャンセル', style: 'cancel' },
                      {
                        text: '解除',
                        onPress: () =>
                          toggleBlock.mutate({ targetId: u.id, block: false }),
                      },
                    ])
                  }
                  style={styles.unblockBtn}
                >
                  <Text style={styles.unblockText}>解除</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>ブロック中のユーザーはいません。</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  sectionDesc: { color: colors.textMuted, fontSize: fontSize.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  rowDesc: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  unblockBtn: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  unblockText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  empty: { color: colors.textMuted, fontSize: fontSize.sm, padding: spacing.lg },
});
