import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import {
  initNotificationHandler,
  checkNotificationPermission,
} from '../services/notifications';

export default function RootLayout() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const { loadSettings } = useNotificationStore();

  useEffect(() => {
    // 通知ハンドラを初期化（ネイティブ未リンク時は何もしない）
    initNotificationHandler();

    // ユーザー情報と通知設定を読み込む
    loadUser();
    loadSettings();

    // 通知パーミッションの状態を確認（ネイティブ未リンク時は false を返す）
    checkNotificationPermission().then((granted) => {
      useNotificationStore.setState({ permissionGranted: granted });
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
