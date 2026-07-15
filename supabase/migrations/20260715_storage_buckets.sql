-- Storage buckets for Garage Profile (avatars, banners, build photos)
-- Run this in Supabase → SQL Editor if buckets are missing.
-- Safe to re-run (idempotent).

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('builds', 'builds', true)
on conflict (id) do update set public = excluded.public;

-- Storage policies
drop policy if exists "Avatar images are public" on storage.objects;
create policy "Avatar images are public"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Banner images are public" on storage.objects;
create policy "Banner images are public"
  on storage.objects for select
  using (bucket_id = 'banners');

drop policy if exists "Users upload own banner" on storage.objects;
create policy "Users upload own banner"
  on storage.objects for insert
  with check (
    bucket_id = 'banners'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own banner" on storage.objects;
create policy "Users update own banner"
  on storage.objects for update
  using (
    bucket_id = 'banners'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own banner" on storage.objects;
create policy "Users delete own banner"
  on storage.objects for delete
  using (
    bucket_id = 'banners'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Build images are public" on storage.objects;
create policy "Build images are public"
  on storage.objects for select
  using (bucket_id = 'builds');

drop policy if exists "Users upload own build photos" on storage.objects;
create policy "Users upload own build photos"
  on storage.objects for insert
  with check (
    bucket_id = 'builds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own build photos" on storage.objects;
create policy "Users update own build photos"
  on storage.objects for update
  using (
    bucket_id = 'builds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own build photos" on storage.objects;
create policy "Users delete own build photos"
  on storage.objects for delete
  using (
    bucket_id = 'builds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
