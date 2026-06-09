import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../lib/supabase';

/**
 * Sign in with Apple（要件 FR-AUTH-02）。
 * Apple が返す identityToken を Supabase Auth に渡してサインインする。
 */
export function useSignInWithApple() {
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('未対応', 'Sign in with Apple は iOS でのみ利用できます。');
      return;
    }
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple の identityToken を取得できませんでした。');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'ERR_REQUEST_CANCELED') {
        return; // ユーザーがキャンセル
      }
      Alert.alert('サインインに失敗しました', err.message ?? '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading };
}
