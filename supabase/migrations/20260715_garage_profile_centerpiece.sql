-- Garage Profile centerpiece expansion
-- Extend profiles/vehicles/builds + timeline, badges, gallery, dyno, social saves
-- Safe to re-run (idempotent where practical)

-- Enums
do $$ begin
  create type public.build_status as enum ('active', 'completed', 'paused');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.mod_status as enum ('installed', 'wishlist');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.album_category as enum (
    'before_after',
    'build',
    'rolling',
    'dyno',
    'garage',
    'general'
  );
exception when duplicate_object then null;
end $$;

-- Profiles extensions
alter table public.profiles
  add column if not exists favorite_manufacturer text,
  add column if not exists favorite_engine text,
  add column if not exists favorite_build_style text,
  add column if not exists favorite_quote text,
  add column if not exists youtube_url text,
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists website_url text,
  add column if not exists accent_color text default '#c4121a',
  add column if not exists years_building int,
  add column if not exists reputation_cached int not null default 0;

-- Vehicles extensions
alter table public.vehicles
  add column if not exists photo_url text,
  add column if not exists nickname text,
  add column if not exists engine text,
  add column if not exists transmission text,
  add column if not exists mileage int,
  add column if not exists current_hp int,
  add column if not exists target_hp int,
  add column if not exists build_stage text,
  add column if not exists progress_pct int not null default 0;

alter table public.vehicles
  drop constraint if exists vehicles_progress_pct_check;
alter table public.vehicles
  add constraint vehicles_progress_pct_check
  check (progress_pct >= 0 and progress_pct <= 100);

-- Builds extensions
alter table public.builds
  add column if not exists progress_pct int not null default 0,
  add column if not exists current_stage text,
  add column if not exists upcoming_stage text,
  add column if not exists estimated_completion date,
  add column if not exists status public.build_status not null default 'active';

alter table public.builds
  drop constraint if exists builds_progress_pct_check;
alter table public.builds
  add constraint builds_progress_pct_check
  check (progress_pct >= 0 and progress_pct <= 100);

-- Modifications extensions
alter table public.modifications
  add column if not exists status public.mod_status not null default 'installed',
  add column if not exists part_brand text,
  add column if not exists part_number text,
  add column if not exists cost_cents int;

-- Badge catalog
create table if not exists public.badges (
  key text primary key,
  label text not null,
  description text,
  sort_order int not null default 0
);

insert into public.badges (key, label, description, sort_order) values
  ('first_build', 'First Build', 'Published your first build.', 10),
  ('weekend_wrench', 'Weekend Wrench', 'Garage rank: Weekend Wrench.', 20),
  ('engine_builder', 'Engine Builder', 'Documented engine work on a vehicle.', 30),
  ('forced_induction', 'Forced Induction', 'Boosted powertrain or turbo/supercharger notes.', 40),
  ('community_favorite', 'Community Favorite', 'Reached 25 followers.', 50),
  ('top_contributor', 'Top Contributor', 'Shared 10+ public builds or timeline updates.', 60),
  ('photographer', 'Photographer', 'Uploaded 10+ garage or build photos.', 70),
  ('helpful_member', 'Helpful Member', 'Left 10+ comments on builds or timeline.', 80)
on conflict (key) do nothing;

create table if not exists public.profile_badges (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  badge_key text not null references public.badges (key) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (profile_id, badge_key)
);

create index if not exists profile_badges_profile_id_idx
  on public.profile_badges (profile_id);

-- Vehicle timeline
create table if not exists public.vehicle_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  build_id uuid references public.builds (id) on delete set null,
  title text not null,
  description text,
  entry_date date not null default current_date,
  photos text[] not null default '{}',
  video_url text,
  parts_installed text,
  cost_cents int,
  hours_spent numeric(8,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicle_timeline_vehicle_id_idx
  on public.vehicle_timeline_entries (vehicle_id, entry_date desc);

create table if not exists public.timeline_entry_likes (
  entry_id uuid not null references public.vehicle_timeline_entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id)
);

create table if not exists public.timeline_entry_comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.vehicle_timeline_entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists timeline_entry_comments_entry_id_idx
  on public.timeline_entry_comments (entry_id, created_at);

-- Maintenance / dyno / ET
create table if not exists public.vehicle_maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  notes text,
  service_date date not null default current_date,
  mileage int,
  cost_cents int,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_dyno_results (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  result_date date not null default current_date,
  whp numeric(8,2),
  wtq numeric(8,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_quarter_mile_times (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  result_date date not null default current_date,
  et_seconds numeric(6,3),
  trap_mph numeric(6,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists vehicle_photos_vehicle_id_idx
  on public.vehicle_photos (vehicle_id, sort_order);

-- Gallery
create table if not exists public.garage_albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category public.album_category not null default 'general',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists garage_albums_user_id_idx
  on public.garage_albums (user_id);

create table if not exists public.garage_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.garage_albums (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  url text not null,
  caption text,
  category public.album_category not null default 'general',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists garage_photos_album_id_idx
  on public.garage_photos (album_id, sort_order);

-- Saved builds
create table if not exists public.saved_builds (
  user_id uuid not null references public.profiles (id) on delete cascade,
  build_id uuid not null references public.builds (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, build_id)
);

-- Updated_at helper (reuse if exists)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vehicle_timeline_set_updated_at on public.vehicle_timeline_entries;
create trigger vehicle_timeline_set_updated_at
  before update on public.vehicle_timeline_entries
  for each row execute function public.set_updated_at();

drop trigger if exists garage_albums_set_updated_at on public.garage_albums;
create trigger garage_albums_set_updated_at
  before update on public.garage_albums
  for each row execute function public.set_updated_at();

-- RLS enable
alter table public.badges enable row level security;
alter table public.profile_badges enable row level security;
alter table public.vehicle_timeline_entries enable row level security;
alter table public.timeline_entry_likes enable row level security;
alter table public.timeline_entry_comments enable row level security;
alter table public.vehicle_maintenance_logs enable row level security;
alter table public.vehicle_dyno_results enable row level security;
alter table public.vehicle_quarter_mile_times enable row level security;
alter table public.vehicle_photos enable row level security;
alter table public.garage_albums enable row level security;
alter table public.garage_photos enable row level security;
alter table public.saved_builds enable row level security;

-- Badges readable by all; awards readable by all; insert via authenticated for own profile
drop policy if exists "Badges catalog readable" on public.badges;
create policy "Badges catalog readable"
  on public.badges for select
  using (true);

drop policy if exists "Profile badges readable" on public.profile_badges;
create policy "Profile badges readable"
  on public.profile_badges for select
  using (true);

drop policy if exists "Profile badges self insert" on public.profile_badges;
create policy "Profile badges self insert"
  on public.profile_badges for insert
  with check (auth.uid() = profile_id);

drop policy if exists "Profile badges self delete" on public.profile_badges;
create policy "Profile badges self delete"
  on public.profile_badges for delete
  using (auth.uid() = profile_id);

-- Timeline readable if vehicle owner OR (default public for owned vehicles of others - all readable)
drop policy if exists "Timeline readable" on public.vehicle_timeline_entries;
create policy "Timeline readable"
  on public.vehicle_timeline_entries for select
  using (true);

drop policy if exists "Timeline owner write" on public.vehicle_timeline_entries;
create policy "Timeline owner write"
  on public.vehicle_timeline_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Timeline likes readable" on public.timeline_entry_likes;
create policy "Timeline likes readable"
  on public.timeline_entry_likes for select
  using (true);

drop policy if exists "Timeline likes insert own" on public.timeline_entry_likes;
create policy "Timeline likes insert own"
  on public.timeline_entry_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Timeline likes delete own" on public.timeline_entry_likes;
create policy "Timeline likes delete own"
  on public.timeline_entry_likes for delete
  using (auth.uid() = user_id);

drop policy if exists "Timeline comments readable" on public.timeline_entry_comments;
create policy "Timeline comments readable"
  on public.timeline_entry_comments for select
  using (true);

drop policy if exists "Timeline comments insert own" on public.timeline_entry_comments;
create policy "Timeline comments insert own"
  on public.timeline_entry_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Timeline comments update own" on public.timeline_entry_comments;
create policy "Timeline comments update own"
  on public.timeline_entry_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Timeline comments delete own" on public.timeline_entry_comments;
create policy "Timeline comments delete own"
  on public.timeline_entry_comments for delete
  using (auth.uid() = user_id);

-- Vehicle logs / photos public read, owner write
drop policy if exists "Maintenance readable" on public.vehicle_maintenance_logs;
create policy "Maintenance readable"
  on public.vehicle_maintenance_logs for select using (true);

drop policy if exists "Maintenance owner write" on public.vehicle_maintenance_logs;
create policy "Maintenance owner write"
  on public.vehicle_maintenance_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Dyno readable" on public.vehicle_dyno_results;
create policy "Dyno readable"
  on public.vehicle_dyno_results for select using (true);

drop policy if exists "Dyno owner write" on public.vehicle_dyno_results;
create policy "Dyno owner write"
  on public.vehicle_dyno_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ET readable" on public.vehicle_quarter_mile_times;
create policy "ET readable"
  on public.vehicle_quarter_mile_times for select using (true);

drop policy if exists "ET owner write" on public.vehicle_quarter_mile_times;
create policy "ET owner write"
  on public.vehicle_quarter_mile_times for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Vehicle photos readable" on public.vehicle_photos;
create policy "Vehicle photos readable"
  on public.vehicle_photos for select using (true);

drop policy if exists "Vehicle photos owner write" on public.vehicle_photos;
create policy "Vehicle photos owner write"
  on public.vehicle_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Gallery: public albums readable; private only owner
drop policy if exists "Albums readable" on public.garage_albums;
create policy "Albums readable"
  on public.garage_albums for select
  using (is_public = true or auth.uid() = user_id);

drop policy if exists "Albums owner write" on public.garage_albums;
create policy "Albums owner write"
  on public.garage_albums for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Garage photos readable" on public.garage_photos;
create policy "Garage photos readable"
  on public.garage_photos for select
  using (
    exists (
      select 1 from public.garage_albums a
      where a.id = album_id and (a.is_public = true or a.user_id = auth.uid())
    )
  );

drop policy if exists "Garage photos owner write" on public.garage_photos;
create policy "Garage photos owner write"
  on public.garage_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Saved builds owner" on public.saved_builds;
create policy "Saved builds owner"
  on public.saved_builds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket for garage media
insert into storage.buckets (id, name, public)
values ('garage', 'garage', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Garage media public read" on storage.objects;
create policy "Garage media public read"
  on storage.objects for select
  using (bucket_id = 'garage');

drop policy if exists "Garage media owner upload" on storage.objects;
create policy "Garage media owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'garage'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Garage media owner update" on storage.objects;
create policy "Garage media owner update"
  on storage.objects for update
  using (
    bucket_id = 'garage'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Garage media owner delete" on storage.objects;
create policy "Garage media owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'garage'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
