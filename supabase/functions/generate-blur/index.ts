// =============================================================
// generate-blur Edge Function
// 投稿直後に呼ばれ、オリジナル画像から「ぼかしサムネ」を生成して
// thumbs バケットへ保存し、posts.blurred_path を更新する。
// 要件 FR-POST-06 / 6.4
//
// ぼかしは「大幅な縮小（ダウンスケール）」で実現する。
// 縮小画像はディテールが失われるため、遠隔閲覧で写真本体を判別できない。
// （より滑らかなガウスぼかしが必要なら画像処理ライブラリへ差し替え可能）
// =============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';

const ORIGINAL_BUCKET = 'photos';
const THUMB_BUCKET = 'thumbs';
const THUMB_WIDTH = 40; // px。小さいほど強くぼける。

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { post_id } = await req.json();
    if (!post_id) {
      return json({ error: 'post_id is required' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: post, error: postErr } = await admin
      .from('posts')
      .select('id, user_id, image_path')
      .eq('id', post_id)
      .single();

    if (postErr || !post) {
      return json({ error: 'post not found' }, 404);
    }

    // オリジナルをダウンロード
    const { data: file, error: dlErr } = await admin.storage
      .from(ORIGINAL_BUCKET)
      .download(post.image_path);
    if (dlErr || !file) {
      return json({ error: 'failed to download original' }, 500);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = await Image.decode(bytes);
    const ratio = image.height / image.width;
    const thumb = image.resize(THUMB_WIDTH, Math.max(1, Math.round(THUMB_WIDTH * ratio)));
    const out = await thumb.encodeJPEG(70);

    // 拡張子を jpg に正規化して thumbs へ保存
    const blurredPath = post.image_path.replace(/\.[^./]+$/, '') + '.jpg';

    const { error: upErr } = await admin.storage
      .from(THUMB_BUCKET)
      .upload(blurredPath, out, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (upErr) {
      return json({ error: `upload failed: ${upErr.message}` }, 500);
    }

    const { error: updErr } = await admin
      .from('posts')
      .update({ blurred_path: blurredPath })
      .eq('id', post_id);
    if (updErr) {
      return json({ error: `update failed: ${updErr.message}` }, 500);
    }

    return json({ ok: true, blurred_path: blurredPath });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
