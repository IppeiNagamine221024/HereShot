import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useLocationStore } from '../stores/locationStore';
import { isWithinUnlockRadius } from '../utils/geo';
import type { PostWithAuthor } from '../types/models';

/**
 * 投稿のオリジナル画像 URL を取得する。
 * - 本人の投稿: 常に取得可能（要件 FR-VIEW-03）
 * - 他人の投稿: 50m 以内（クライアント Haversine）のときのみ unlock-post を呼ぶ（FR-VIEW-02/04）
 *
 * GPS 誤判定の救済 UI は設けない（FR-VIEW-05/06）。
 */
export function useUnlockPost(post: PostWithAuthor | null) {
  const coords = useLocationStore((s) => s.coords);

  const within =
    !!coords &&
    !!post &&
    isWithinUnlockRadius(
      { latitude: post.lat, longitude: post.lng },
      coords,
    );

  const canUnlock = !!post && (post.is_own || within);

  return useQuery({
    queryKey: ['unlock', post?.id, post?.is_own || within],
    enabled: canUnlock,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('unlock-post', {
        body: {
          post_id: post!.id,
          lat: coords?.latitude ?? post!.lat,
          lng: coords?.longitude ?? post!.lng,
        },
      });
      if (error) throw error;
      return (data as { url: string }).url;
    },
  });
}

/**
 * クライアント側で現在地から投稿が解放範囲内かを返すヘルパー。
 */
export function useIsWithinRadius(post: PostWithAuthor | null): boolean {
  const coords = useLocationStore((s) => s.coords);
  if (!coords || !post) return false;
  return isWithinUnlockRadius(
    { latitude: post.lat, longitude: post.lng },
    coords,
  );
}
