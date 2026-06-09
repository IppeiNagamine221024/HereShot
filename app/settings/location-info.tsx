import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UNLOCK_RADIUS_METERS } from '../../src/constants';
import { colors } from '../../src/theme/colors';
import { fontSize, radius, spacing } from '../../src/theme/layout';

export default function LocationInfoScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Item
        icon="navigate"
        title="現在地の利用"
        body={`HereShot は、投稿地点から ${UNLOCK_RADIUS_METERS}m 以内にいるかどうかを判定し、近くの写真を「解放」するために現在地を利用します。位置情報はアプリ使用中のみ取得します。`}
      />
      <Item
        icon="lock-open"
        title="現地解放のしくみ"
        body={`遠隔ではぼかしサムネ・場所名・投稿日時のみが見えます。投稿地点に近づき ${UNLOCK_RADIUS_METERS}m 以内に入ると、写真本体が表示されます。判定は端末側で行います。`}
      />
      <Item
        icon="shield-checkmark"
        title="投稿者の位置は非公開"
        body="表示されるのは投稿された場所のピンのみです。投稿者の現在地が他のユーザーに共有されることはありません。"
      />
      <Item
        icon="sparkles"
        title="GPS のブレについて"
        body="GPS には誤差があり、ぴったり 50m で切り替わらないことがあります。HereShot ではこれを救済せず、仕様・遊びとして楽しめるようにしています。"
      />
    </ScrollView>
  );
}

function Item({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.iconRow}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  body: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 22 },
});
