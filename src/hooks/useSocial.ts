import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from '../providers/AuthProvider';
import type { Profile, UserSearchResult } from '../types/models';

/**
 * ユーザー名検索（要件 FR-SOC-04）。
 */
export function useSearchUsers(query: string) {
  const { userId } = useAuth();
  const trimmed = query.trim();
  return useQuery({
    queryKey: queryKeys.searchUsers(trimmed),
    enabled: trimmed.length >= 1,
    queryFn: async (): Promise<UserSearchResult[]> => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${trimmed}%`)
        .neq('id', userId ?? '')
        .limit(30);
      if (error) throw error;

      const ids = (profiles ?? []).map((p) => p.id);
      if (ids.length === 0) return [];

      // 自分がフォローしている相手を取得
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId ?? '')
        .in('following_id', ids);
      const followingSet = new Set((following ?? []).map((f) => f.following_id));

      return (profiles as Profile[]).map((p) => ({
        ...p,
        is_following: followingSet.has(p.id),
        follower_count: 0,
      }));
    },
  });
}

/**
 * フォロー / フォロワー数（要件 3.3）。
 */
export function useFollowCounts(targetId: string | null) {
  return useQuery({
    queryKey: targetId ? ['followCounts', targetId] : ['followCounts', 'none'],
    enabled: !!targetId,
    queryFn: async () => {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', targetId as string),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', targetId as string),
      ]);
      return { followers: followers ?? 0, following: following ?? 0 };
    },
  });
}

/**
 * 指定ユーザーへのフォロー状態を取得する。
 */
export function useFollowState(targetId: string | null) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: targetId ? queryKeys.followState(targetId) : ['follow', 'none'],
    enabled: !!targetId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', userId as string)
        .eq('following_id', targetId as string)
        .maybeSingle();
      if (error) throw error;
      return { isFollowing: !!data };
    },
  });
}

/**
 * フォロー / アンフォロー（要件 FR-SOC-01）。
 */
export function useToggleFollow() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetId,
      follow,
    }: {
      targetId: string;
      follow: boolean;
    }) => {
      if (!userId) throw new Error('未ログインです');
      if (follow) {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: userId, following_id: targetId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', targetId);
        if (error) throw error;
      }
      return follow;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.followState(vars.targetId) });
      qc.invalidateQueries({ queryKey: ['users', 'search'] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

/**
 * ブロック一覧（要件 FR-PRIV-04/05, FR-SET-02）。
 */
export function useBlocks() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: queryKeys.blocks,
    enabled: !!userId,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocked_id, profiles!blocks_blocked_id_fkey(*)')
        .eq('blocker_id', userId as string);
      if (error) throw error;
      return (data ?? [])
        .map((r: any) => r.profiles as Profile)
        .filter(Boolean);
    },
  });
}

export function useToggleBlock() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetId,
      block,
    }: {
      targetId: string;
      block: boolean;
    }) => {
      if (!userId) throw new Error('未ログインです');
      if (block) {
        const { error } = await supabase
          .from('blocks')
          .insert({ blocker_id: userId, blocked_id: targetId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blocks')
          .delete()
          .eq('blocker_id', userId)
          .eq('blocked_id', targetId);
        if (error) throw error;
      }
      return block;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.blocks });
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['follow'] });
    },
  });
}
