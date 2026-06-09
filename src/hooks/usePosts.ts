import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { buildThumbUrl, getOwnOriginalUrl, ORIGINAL_BUCKET } from '../lib/storage';
import type { BoundingBox, PostWithAuthor, Visibility } from '../types/models';
import { useAuth } from '../providers/AuthProvider';

function rowToPost(
  row: {
    id: string;
    user_id: string;
    lat: number;
    lng: number;
    place_name: string | null;
    image_path: string | null;
    blurred_path: string | null;
    visibility: Visibility;
    created_at: string;
    author_username: string;
    author_avatar_url: string | null;
  },
  myId: string | null,
): PostWithAuthor {
  return {
    id: row.id,
    user_id: row.user_id,
    lat: row.lat,
    lng: row.lng,
    place_name: row.place_name,
    image_url: null,
    blurred_url: buildThumbUrl(row.blurred_path),
    visibility: row.visibility,
    created_at: row.created_at,
    author: {
      id: row.user_id,
      username: row.author_username,
      avatar_url: row.author_avatar_url,
    },
    is_own: !!myId && row.user_id === myId,
  };
}

/**
 * 表示範囲内の閲覧可能な投稿ピンを取得する（要件 FR-MAP-05）。
 */
export function usePostsInBbox(bbox: BoundingBox | null) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: bbox ? queryKeys.postsInBbox(bbox) : ['posts', 'bbox', 'none'],
    enabled: !!bbox,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('posts_in_bbox', {
        min_lat: bbox!.minLat,
        min_lng: bbox!.minLng,
        max_lat: bbox!.maxLat,
        max_lng: bbox!.maxLng,
      });
      if (error) throw error;
      return (data ?? []).map((row) => rowToPost(row, userId));
    },
  });
}

/**
 * 単一投稿を取得する（投稿詳細シート用）。RLS により閲覧権限を担保。
 */
export function usePost(id: string | null) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: id ? ['post', id] : ['post', 'none'],
    enabled: !!id,
    queryFn: async (): Promise<PostWithAuthor | null> => {
      const { data, error } = await supabase
        .from('posts')
        .select(
          'id, user_id, lat, lng, place_name, image_path, blurred_path, visibility, created_at, profiles!inner(username, avatar_url)',
        )
        .eq('id', id as string)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as any;
      return rowToPost(
        {
          ...row,
          author_username: row.profiles?.username ?? '',
          author_avatar_url: row.profiles?.avatar_url ?? null,
        },
        userId,
      );
    },
  });
}

/**
 * 自分の投稿一覧（常にフル表示・要件 FR-VIEW-03）。
 */
export function useMyPosts(targetUserId?: string | null) {
  const { userId } = useAuth();
  const uid = targetUserId ?? userId;
  return useQuery({
    queryKey: uid ? queryKeys.userPosts(uid) : ['posts', 'user', 'none'],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(
          'id, user_id, lat, lng, place_name, image_path, blurred_path, visibility, created_at, profiles!inner(username, avatar_url)',
        )
        .eq('user_id', uid as string)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const isMe = uid === userId;
      return Promise.all(
        (data ?? []).map(async (row: any) => {
          const post = rowToPost(
            {
              ...row,
              author_username: row.profiles?.username ?? '',
              author_avatar_url: row.profiles?.avatar_url ?? null,
            },
            userId,
          );
          // 本人の投稿はオリジナルをフル表示
          if (isMe && row.image_path) {
            post.image_url = await getOwnOriginalUrl(row.image_path);
          }
          return post;
        }),
      );
    },
  });
}

export interface CreatePostInput {
  localUri: string;
  lat: number;
  lng: number;
  placeName: string | null;
  visibility: Visibility;
}

/**
 * アプリ内カメラで撮影した写真を投稿する（要件 FR-POST-01..06）。
 */
export function useCreatePost() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!userId) throw new Error('未ログインです');

      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const imagePath = `${userId}/${unique}.jpg`;

      // ローカルファイルをバイト列として読み込みアップロード
      const bytes = await new File(input.localUri).bytes();
      const { error: upErr } = await supabase.storage
        .from(ORIGINAL_BUCKET)
        .upload(imagePath, bytes, {
          contentType: 'image/jpeg',
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data: post, error: insErr } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          lat: input.lat,
          lng: input.lng,
          place_name: input.placeName,
          image_path: imagePath,
          visibility: input.visibility,
        })
        .select('id')
        .single();
      if (insErr) throw insErr;

      // ぼかしサムネ生成（ベストエフォート）
      try {
        await supabase.functions.invoke('generate-blur', {
          body: { post_id: post.id },
        });
      } catch (e) {
        console.warn('[generate-blur] failed', e);
      }

      return post.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
