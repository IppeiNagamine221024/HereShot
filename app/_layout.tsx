import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { queryClient } from '../src/lib/queryClient';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { useCurrentLocation } from '../src/hooks/useCurrentLocation';
import { LoadingView } from '../src/components/StateViews';
import { colors } from '../src/theme/colors';

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // 現在地の購読（権限取得）
  useCurrentLocation();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <LoadingView label="読み込み中..." />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="capture"
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
      <Stack.Screen
        name="compose"
        options={{ presentation: 'modal', title: '投稿する' }}
      />
      <Stack.Screen
        name="post/[id]"
        options={{ presentation: 'modal', title: '投稿' }}
      />
      <Stack.Screen name="user/[id]" options={{ title: 'プロフィール' }} />
      <Stack.Screen name="settings/edit-profile" options={{ title: 'プロフィール編集' }} />
      <Stack.Screen name="settings/privacy" options={{ title: 'プライバシー' }} />
      <Stack.Screen name="settings/location-info" options={{ title: '位置情報について' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
