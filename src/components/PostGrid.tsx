import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { PostWithAuthor } from '../types/models';
import { colors } from '../theme/colors';

interface Props {
  posts: PostWithAuthor[];
}

/**
 * 投稿サムネのグリッド。
 * 本人の投稿はオリジナル、他人の投稿はぼかしサムネ（ロック表示）。
 */
export function PostGrid({ posts }: Props) {
  const router = useRouter();
  return (
    <View style={styles.grid}>
      {posts.map((post) => {
        const uri = post.is_own ? post.image_url ?? post.blurred_url : post.blurred_url;
        return (
          <Pressable
            key={post.id}
            style={styles.cell}
            onPress={() => router.push(`/post/${post.id}`)}
          >
            <Image
              source={{ uri: uri ?? undefined }}
              style={styles.image}
              contentFit="cover"
              transition={150}
            />
            {!post.is_own ? (
              <View style={styles.lock}>
                <Ionicons name="lock-closed" size={14} color={colors.white} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  cell: {
    width: '33%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
  },
  image: { width: '100%', height: '100%' },
  lock: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.overlay,
    borderRadius: 10,
    padding: 4,
  },
});
