import { Redirect } from 'expo-router';

/**
 * 中央カメラタブの実体。通常はタブ押下が preventDefault されるため
 * 表示されないが、直接アクセスされた場合は撮影モーダルへ誘導する。
 */
export default function CameraTabRedirect() {
  return <Redirect href="/camera" />;
}
