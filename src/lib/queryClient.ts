import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  session: ['session'] as const,
  profile: (id: string) => ['profile', id] as const,
  myProfile: ['profile', 'me'] as const,
  postsInBbox: (bbox: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  }) => ['posts', 'bbox', bbox] as const,
  myPosts: (userId: string) => ['posts', 'user', userId] as const,
  userPosts: (userId: string) => ['posts', 'user', userId] as const,
  searchUsers: (q: string) => ['users', 'search', q] as const,
  followState: (userId: string) => ['follow', userId] as const,
  blocks: ['blocks'] as const,
};
