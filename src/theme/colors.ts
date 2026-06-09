/**
 * HereShot のカラーパレット。
 * マップ中心のダークトーンを基調に、解放体験を引き立てるアクセントを定義する。
 */
export const colors = {
  bg: '#0B1021',
  bgElevated: '#141A30',
  surface: '#1C2440',
  surfaceMuted: '#252E4D',
  border: '#2E3759',
  text: '#F5F7FF',
  textMuted: '#9AA3C2',
  textFaint: '#646E92',
  primary: '#5B8DEF',
  primaryDark: '#3E6BD0',
  accent: '#FF6B6B',
  success: '#3DDC97',
  warning: '#FFC857',
  danger: '#FF5C5C',
  locked: '#3A4366',
  overlay: 'rgba(11, 16, 33, 0.6)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type AppColor = keyof typeof colors;
