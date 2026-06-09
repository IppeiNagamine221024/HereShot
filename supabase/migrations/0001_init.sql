-- =============================================================
-- HereShot 初期スキーマ
-- profiles / posts / follows / blocks + RLS + PostGIS bbox クエリ
-- 要件: docs/requirements.md 6.3 / 6.4 / 5.3
-- =============================================================

-- 拡張機能 ----------------------------------------------------
create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- 公開範囲の enum（要件 2.3）---------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'visibility') then
    create type visibility as enum ('followers', 'mutual', 'public');
  end if;
end$$;

-- profiles ----------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text,
  default_visibility visibility not null default 'followers',
  created_at timestamptz not null default now()
);

-- posts -------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  -- PostGIS の地理座標（bbox / 近傍クエリ用）。lat/lng から自動生成。
  geom geography(Point, 4326) generated always as
    (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  place_name text,
  -- Storage 上のオブジェクトパス（URL ではなくパスを保持）
  image_path text not null,
  blurred_path text,
  visibility visibility not null default 'followers',
  created_at timestamptz not null default now()
);

create index if not exists posts_geom_idx on public.posts using gist (geom);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- follows -----------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);

-- blocks ------------------------------------------------------
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_no_self check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

-- =============================================================
-- ヘルパー関数（RLS から参照）
-- =============================================================

-- viewer が author をフォローしているか
create or replace function public.is_following(viewer uuid, author uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.follows f
    where f.follower_id = viewer and f.following_id = author
  );
$$;

-- a と b が相互フォローか
create or replace function public.is_mutual(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_following(a, b) and public.is_following(b, a);
$$;

-- a と b の間にブロック関係があるか（どちら向きでも true）
create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks bl
    where (bl.blocker_id = a and bl.blocked_id = b)
       or (bl.blocker_id = b and bl.blocked_id = a)
  );
$$;

-- 投稿 p を viewer が閲覧（ピン表示）できるか（要件 2.2 / 2.3）
create or replace function public.can_view_post(viewer uuid, author uuid, vis visibility)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when viewer = author then true
      when public.is_blocked_pair(viewer, author) then false
      when vis = 'public' then true
      when vis = 'followers' then public.is_following(viewer, author)
      when vis = 'mutual' then public.is_mutual(viewer, author)
      else false
    end;
$$;

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;

-- profiles: 誰でも閲覧可（ブロック相手は除く）。本人のみ更新。
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid() or not public.is_blocked_pair(auth.uid(), id)
  );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- posts: 可視性ルールに基づき select。本人のみ insert/update/delete。
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts
  for select using (
    public.can_view_post(auth.uid(), user_id, visibility)
  );

drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts
  for insert with check (user_id = auth.uid());

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts
  for delete using (user_id = auth.uid());

-- follows: 本人が follower のものを管理。閲覧は関係者のみ。
drop policy if exists follows_select on public.follows;
create policy follows_select on public.follows
  for select using (
    follower_id = auth.uid() or following_id = auth.uid()
  );

drop policy if exists follows_insert on public.follows;
create policy follows_insert on public.follows
  for insert with check (
    follower_id = auth.uid()
    and not public.is_blocked_pair(follower_id, following_id)
  );

drop policy if exists follows_delete on public.follows;
create policy follows_delete on public.follows
  for delete using (follower_id = auth.uid());

-- blocks: 本人が blocker のものを管理。
drop policy if exists blocks_select on public.blocks;
create policy blocks_select on public.blocks
  for select using (blocker_id = auth.uid());

drop policy if exists blocks_insert on public.blocks;
create policy blocks_insert on public.blocks
  for insert with check (blocker_id = auth.uid());

drop policy if exists blocks_delete on public.blocks;
create policy blocks_delete on public.blocks
  for delete using (blocker_id = auth.uid());

-- ブロックすると相互フォローを解除する
create or replace function public.remove_follows_on_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return new;
end;
$$;

drop trigger if exists trg_remove_follows_on_block on public.blocks;
create trigger trg_remove_follows_on_block
  after insert on public.blocks
  for each row execute function public.remove_follows_on_block();

-- =============================================================
-- bbox クエリ（要件 FR-MAP-05）
-- 表示範囲内かつ閲覧権限のある投稿を返す。
-- image_path は本人のみ返す（要件 6.4: 遠隔はぼかしのみ）。
-- =============================================================
create or replace function public.posts_in_bbox(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision
)
returns table (
  id uuid,
  user_id uuid,
  lat double precision,
  lng double precision,
  place_name text,
  image_path text,
  blurred_path text,
  visibility visibility,
  created_at timestamptz,
  author_username text,
  author_avatar_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.user_id,
    p.lat,
    p.lng,
    p.place_name,
    case when p.user_id = auth.uid() then p.image_path else null end as image_path,
    p.blurred_path,
    p.visibility,
    p.created_at,
    pr.username as author_username,
    pr.avatar_url as author_avatar_url
  from public.posts p
  join public.profiles pr on pr.id = p.user_id
  where p.geom && st_makeenvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
    and public.can_view_post(auth.uid(), p.user_id, p.visibility);
$$;

-- =============================================================
-- 新規ユーザー登録時に profiles を自動作成
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  final_name text;
  suffix int := 0;
begin
  base_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    'user_' || substr(new.id::text, 1, 8)
  );
  final_name := base_name;
  while exists (select 1 from public.profiles where username = final_name) loop
    suffix := suffix + 1;
    final_name := base_name || '_' || suffix;
  end loop;

  insert into public.profiles (id, username)
  values (new.id, final_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
