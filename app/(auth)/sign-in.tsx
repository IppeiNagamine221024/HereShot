import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignInWithApple } from '../../src/hooks/useSignInWithApple';
import { colors } from '../../src/theme/colors';
import { fontSize, radius, spacing } from '../../src/theme/layout';

export default function SignInScreen() {
  const { signIn } = useSignInWithApple();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>HereShot</Text>
        <Text style={styles.tagline}>ここで撮った。ここで見る。</Text>
        <Text style={styles.description}>
          友達が撮った場所へ行くと、写真が解放される。{'\n'}
          思い出を目的地にして、外に出よう。
        </Text>
      </View>

      <View style={styles.footer}>
        {Platform.OS === 'ios' ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            }
            cornerRadius={radius.md}
            style={styles.appleButton}
            onPress={signIn}
          />
        ) : (
          <Text style={styles.notice}>
            Sign in with Apple は iOS でのみ利用できます。
          </Text>
        )}
        <Text style={styles.terms}>
          続行すると、利用規約とプライバシーポリシーに同意したものとみなされます。
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  logo: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  footer: {
    gap: spacing.md,
  },
  appleButton: {
    height: 52,
    width: '100%',
  },
  notice: {
    color: colors.warning,
    textAlign: 'center',
  },
  terms: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});
