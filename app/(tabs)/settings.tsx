import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/providers/AuthProvider';
import { useMyProfile } from '../../src/hooks/useProfile';
import { Avatar } from '../../src/components/Avatar';
import { colors } from '../../src/theme/colors';
import { fontSize, radius, spacing } from '../../src/theme/layout';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data: profile } = useMyProfile();

  const confirmSignOut = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>設定</Text>

        <Pressable
          style={styles.profileCard}
          onPress={() => router.push('/settings/edit-profile')}
        >
          <Avatar uri={profile?.avatar_url} name={profile?.username} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>@{profile?.username ?? '...'}</Text>
            <Text style={styles.muted}>プロフィールを編集</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
        </Pressable>

        <Section title="アカウント">
          <Row
            icon="person-circle-outline"
            label="プロフィール編集"
            onPress={() => router.push('/settings/edit-profile')}
          />
          <Row icon="log-out-outline" label="ログアウト" onPress={confirmSignOut} danger />
        </Section>

        <Section title="プライバシー">
          <Row
            icon="lock-closed-outline"
            label="デフォルト公開範囲・ブロック"
            onPress={() => router.push('/settings/privacy')}
          />
        </Section>

        <Section title="位置情報">
          <Row
            icon="location-outline"
            label="位置情報の利用について"
            onPress={() => router.push('/settings/location-info')}
          />
        </Section>

        <Section title="その他">
          <Row
            icon="document-text-outline"
            label="利用規約"
            onPress={() => Linking.openURL('https://hereshot.app/terms')}
          />
          <Row
            icon="shield-checkmark-outline"
            label="プライバシーポリシー"
            onPress={() => Linking.openURL('https://hereshot.app/privacy')}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.textMuted} />
      <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  screenTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  username: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  muted: { color: colors.textMuted, fontSize: fontSize.sm },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { flex: 1, color: colors.text, fontSize: fontSize.md },
});
