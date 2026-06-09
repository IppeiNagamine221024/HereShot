import { View, StyleSheet } from 'react-native';
import { colors } from '../../src/theme/colors';

/**
 * 中央カメラタブのプレースホルダー（タブバー用スロット）。
 * 実際の撮影は /capture モーダルで行う。
 */
export default function CameraTabPlaceholder() {
  return <View style={styles.placeholder} />;
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, backgroundColor: colors.bg },
});
