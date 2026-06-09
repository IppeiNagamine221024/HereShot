import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMyProfile, useUpdateProfile } from '../../src/hooks/useProfile';
import { Button } from '../../src/components/Button';
import { LoadingView } from '../../src/components/StateViews';
import { colors } from '../../src/theme/colors';
import { fontSize, radius, spacing } from '../../src/theme/layout';

export default function EditProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setBio(profile.bio ?? '');
    }
  }, [profile]);

  if (isLoading) return <LoadingView />;

  const onSave = async () => {
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      Alert.alert('エラー', 'ユーザー名は2文字以上にしてください。');
      return;
    }
    try {
      await updateProfile.mutateAsync({ username: trimmed, bio: bio.trim() || null });
      router.back();
    } catch (e: any) {
      const msg = e?.message?.includes('duplicate')
        ? 'このユーザー名は既に使われています。'
        : (e?.message ?? '保存に失敗しました');
      Alert.alert('エラー', msg);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>ユーザー名</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="username"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          autoCapitalize="none"
          maxLength={30}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>自己紹介</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="自己紹介を入力"
          placeholderTextColor={colors.textFaint}
          style={[styles.input, styles.multiline]}
          multiline
          maxLength={160}
        />
      </View>

      <Button label="保存" onPress={onSave} loading={updateProfile.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  field: { gap: spacing.sm },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
    color: colors.text,
    fontSize: fontSize.md,
  },
  multiline: { height: 110, paddingTop: spacing.md, textAlignVertical: 'top' },
});
