/**
 * 投稿の公開範囲（要件 2.3）。
 * - followers: フォロワーのみ
 * - mutual:    相互フォロー
 * - public:    公開（誰でも閲覧可能）
 */
export type Visibility = 'followers' | 'mutual' | 'public';

export const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string }[] = [
  {
    value: 'followers',
    label: 'フォロワーのみ',
    description: 'あなたをフォローしているユーザーが閲覧できます',
  },
  {
    value: 'mutual',
    label: '相互フォロー',
    description: '相互にフォローしているユーザーのみ閲覧できます',
  },
  {
    value: 'public',
    label: '公開',
    description: 'フォロー関係なく誰でも地図上で発見できます',
  },
];

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  default_visibility: Visibility;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  place_name: string | null;
  /** オリジナル画像 URL。閲覧権限が無い場合は null。 */
  image_url: string | null;
  /** ぼかしサムネ URL。常に返る。 */
  blurred_url: string | null;
  visibility: Visibility;
  created_at: string;
}

/**
 * 地図表示やフィードで使う、投稿者情報を含んだ投稿。
 */
export interface PostWithAuthor extends Post {
  author: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
  /** 閲覧者自身の投稿かどうか（本人は常にフル表示）。 */
  is_own: boolean;
}

/**
 * 地図の表示範囲（bounding box）。
 */
export interface BoundingBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface UserSearchResult extends Profile {
  is_following: boolean;
  follower_count: number;
}
