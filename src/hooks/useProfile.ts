import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Profile, Visibility } from '../types/models';
import { useAuth } from '../providers/AuthProvider';

async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function useProfile(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.profile(id) : ['profile', 'none'],
    queryFn: () => fetchProfile(id as string),
    enabled: !!id,
  });
}

export function useMyProfile() {
  const { userId } = useAuth();
  return useProfile(userId);
}

interface UpdateProfileInput {
  username?: string;
  bio?: string | null;
  avatar_url?: string | null;
  default_visibility?: Visibility;
}

export function useUpdateProfile() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!userId) throw new Error('未ログインです');
      const { data, error } = await supabase
        .from('profiles')
        .update(input)
        .eq('id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.profile(data.id), data);
    },
  });
}
