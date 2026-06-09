-- =============================================================
-- Storage バケットとポリシー
-- photos: オリジナル画像（プライベート）
-- thumbs: ぼかしサムネ（公開）
-- 要件 5.3: 閲覧権限に応じてオリジナル / ぼかし URL を出し分け
-- =============================================================

insert into storage.buckets (id, name, public)
values
  ('photos', 'photos', false),
  ('thumbs', 'thumbs', true)
on conflict (id) do nothing;

-- photos（プライベート）-------------------------------------
-- アップロードは本人フォルダ（{uid}/...）のみ許可
drop policy if exists "photos insert own" on storage.objects;
create policy "photos insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 読み取りは本人のみ（他人の現地解放は Edge Function が service role で署名）
drop policy if exists "photos select own" on storage.objects;
create policy "photos select own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos delete own" on storage.objects;
create policy "photos delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- thumbs（公開）---------------------------------------------
-- 読み取りは公開。書き込みは Edge Function（service role）が行う。
drop policy if exists "thumbs public read" on storage.objects;
create policy "thumbs public read" on storage.objects
  for select to public
  using (bucket_id = 'thumbs');
