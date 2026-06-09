// =============================================================
// unlock-post Edge Function
// 現地解放（50m 以内）または本人の場合に、オリジナル画像の
// 短命な署名付き URL を発行する。
// 要件 FR-VIEW-02 / FR-VIEW-03 / 6.4
//
// クライアントの Haversine 判定に加え、サーバー側でも距離を
// 再計算して防御する（GPS のブレ・裏技は仕様として許容）。
// =============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ORIGINAL_BUCKET = 'photos';
const UNLOCK_RADIUS_METERS = 50;
const SIGNED_URL_TTL = 60 * 10; // 10 分

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'missing authorization' }, 401);
    }

    const { post_id, lat, lng } = await req.json();
    if (!post_id || typeof lat !== 'number' || typeof lng !== 'number') {
      return json({ error: 'post_id, lat, lng are required' }, 400);
    }

    // 呼び出しユーザーの JWT を引き継いだクライアント（RLS で可視性を担保）
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return json({ error: 'unauthorized' }, 401);
    }

    // RLS により、閲覧権限のある投稿のみ取得できる
    const { data: post, error: postErr } = await userClient
      .from('posts')
      .select('id, user_id, lat, lng, image_path')
      .eq('id', post_id)
      .single();

    if (postErr || !post) {
      return json({ error: 'forbidden' }, 403);
    }

    const isOwner = post.user_id === user.id;
    const distance = haversine(post.lat, post.lng, lat, lng);

    if (!isOwner && distance > UNLOCK_RADIUS_METERS) {
      return json(
        { error: 'too far', distance: Math.round(distance) },
        403,
      );
    }

    // service role でオリジナルの署名付き URL を発行
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: signed, error: signErr } = await admin.storage
      .from(ORIGINAL_BUCKET)
      .createSignedUrl(post.image_path, SIGNED_URL_TTL);

    if (signErr || !signed) {
      return json({ error: 'failed to sign url' }, 500);
    }

    return json({ url: signed.signedUrl, distance: Math.round(distance) });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
