# HereShot

> ここで撮った。ここで見る。

写真と撮影場所を結び付け、友達が撮った場所に行くことで写真を「解放」できる位置連動型ソーシャルアプリ。
遠隔では地図上のピン・場所名・ぼかしサムネのみ閲覧でき、投稿地点から **50m 以内** に入ると写真本体が表示される。

要件定義は [`docs/requirements.md`](docs/requirements.md) を参照。

## 技術スタック

| レイヤー | 採用技術 |
|---------|---------|
| モバイル | Expo (React Native) SDK 56 + TypeScript |
| ナビゲーション | Expo Router（4 タブ + 中央カメラモーダル） |
| 地図 | react-native-maps（iOS: Apple Maps） |
| 場所検索 | Mapbox Geocoding API |
| 位置情報 | expo-location（クライアント側 Haversine で 50m 判定） |
| カメラ | expo-camera（アプリ内カメラのみ。※下記「カメラについて」参照） |
| バックエンド | Supabase（Auth / PostgreSQL + PostGIS / Storage / Edge Functions） |
| 状態管理 | TanStack Query + Zustand |
| 認証 | Supabase Auth + Sign in with Apple |

## ディレクトリ構成

```
app/                       Expo Router のルート（画面）
  _layout.tsx              Provider群 + 認証ガード
  (auth)/sign-in.tsx       サインイン（Sign in with Apple）
  (tabs)/                  4タブ + 中央カメラ
    index.tsx              ホーム（マップ・場所検索・ピン）
    profile.tsx            マイページ
    search.tsx             ユーザー検索
    settings.tsx           設定
    camera.tsx             中央カメラタブ（/camera へ誘導）
  camera.tsx               撮影（フルスクリーンモーダル）
  compose.tsx              投稿作成（場所名・公開範囲）
  post/[id].tsx            投稿詳細（現地解放）
  user/[id].tsx            他ユーザーのプロフィール
  settings/                プロフィール編集・プライバシー・位置情報説明
src/
  components/              共通 UI
  hooks/                   データ取得・操作（React Query）
  lib/                     supabase / mapbox / storage / queryClient
  providers/               AuthProvider
  stores/                  Zustand（location / compose）
  types/                   DB 型・ドメインモデル
  utils/                   Haversine・整形
supabase/
  migrations/              スキーマ・RLS・PostGIS・bbox 関数・Storage
  functions/               Edge Functions（generate-blur / unlock-post）
```

## セットアップ

### 1. 依存インストール

```bash
npm install
```

### 2. 環境変数

`.env.example` をコピーして `.env` を作成し、値を設定する。

```bash
cp .env.example .env
```

| 変数 | 説明 |
|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Mapbox 公開トークン |

### 3. Supabase

[Supabase CLI](https://supabase.com/docs/guides/cli) を使う場合:

```bash
supabase link --project-ref <your-project-ref>

# スキーマ・RLS・Storage バケットを適用
supabase db push   # もしくは supabase/migrations/*.sql を SQL Editor で実行

# Edge Functions をデプロイ
supabase functions deploy generate-blur
supabase functions deploy unlock-post
```

Sign in with Apple は Supabase ダッシュボードの **Authentication > Providers > Apple** を有効化し、
Apple Developer 側で Service ID / Key を設定する。

### 4. 起動（開発ビルド）

`react-native-maps` 等のネイティブモジュールを含むため Expo Go では動作しない。
開発ビルド（Dev Client）を使用する。

```bash
# iOS 開発ビルド（Windows からは EAS のクラウドビルドを使用）
npx eas build --profile development --platform ios

# Metro 起動
npx expo start --dev-client
```

## 段階的閲覧モデル（コア機能）

| 状況 | 表示 |
|------|------|
| 他人の投稿・遠隔 | 地図ピン + 場所名 + 投稿日時 + ぼかしサムネ |
| 他人の投稿・50m 以内 | 写真本体をフル表示（`unlock-post` が署名 URL を発行） |
| 本人の投稿 | 常にフル表示 |

- 50m 判定はクライアント側 Haversine（`src/utils/geo.ts`）。
- GPS 誤判定の救済 UI は設けない（仕様・遊びとして許容）。
- オリジナル画像はプライベートバケット。遠隔では公開バケットのぼかしサムネのみ参照。

## カメラについて（要件からの変更点）

要件では `react-native-vision-camera` を推奨していたが、SDK 56 時点の最新 v5 は
Nitro ベースへ刷新され追加のネイティブ依存と設定が必要で、当環境ではビルド検証ができないため、
**MVP では Expo 純正の `expo-camera` を採用**した。

- 「アプリ内カメラのみ・カメラロール不可」という要件 (FR-POST-01) は維持している。
- 将来 vision-camera へ戻す場合は `app/camera.tsx` と `app.json` のカメラプラグインを差し替える。

## スクリプト

| コマンド | 内容 |
|---------|------|
| `npm start` | Metro 起動 |
| `npm run ios` | iOS 起動 |
| `npm run typecheck` | 型チェック（`tsc --noEmit`） |
