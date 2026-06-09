import { supabase } from './supabase';

/** オリジナル画像（プライベート）バケット。 */
export const ORIGINAL_BUCKET = 'photos';
/** ぼかしサムネ（公開）バケット。 */
export const THUMB_BUCKET = 'thumbs';

/**
 * 公開バケット上のぼかしサムネのパスから、表示用 URL を生成する。
 */
export function buildThumbUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(THUMB_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * 本人の投稿のオリジナル画像について署名付き URL を発行する。
 * （Storage RLS により本人のみ取得可能）
 */
export async function getOwnOriginalUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(ORIGINAL_BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error) {
    console.warn('[storage] createSignedUrl failed', error.message);
    return null;
  }
  return data.signedUrl;
}
