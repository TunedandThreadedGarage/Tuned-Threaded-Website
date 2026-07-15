-- Tuned & Threaded Garage Profile schema
-- Run in the Supabase SQL editor after creating a project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  banner_url text,
  accent_color text default '#C8B49A',
  bio text default '',
  location text default '',
  garage_rank text default 'Apprentice',
  favorite_manufacturer text default '',
  favorite_engine text default '',
  favorite_build_style text default '',
  favorite_quote text default '',
  social_youtube text,
  social_instagram text,
  social_tiktok text,
  social_website text,
  reputation_score integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.badges (
  id text primary key,
  label text not null,
  emoji text not null,
  description text not null
);

create table if not exists public.profile_badges (
  profile_id uuid references public.profiles (id) on delete cascade,
  badge_id text references public.badges (id) on delete cascade,
  awarded_at timestamptz default now(),
  primary key (profile_id, badge_id)
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  photo_url text,
  year integer not null,
  make text not null,
  model text not null,
  trim text default '',
  engine text default '',
  transmission text default '',
  mileage integer default 0,
  current_horsepower integer default 0,
  target_horsepower integer default 0,
  current_stage text default 'Planning',
  upcoming_stage text,
  progress_percent integer default 0 check (progress_percent between 0 and 100),
  estimated_completion date,
  notes text default '',
  future_goals text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  name text not null,
  brand text default '',
  category text default '',
  installed boolean default false,
  cost numeric(12, 2),
  installed_at date
);

create table if not exists public.build_updates (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  photos text[] default '{}',
  video_url text,
  parts_installed text[] default '{}',
  cost numeric(12, 2),
  time_spent_hours numeric(8, 1),
  created_at timestamptz default now()
);

create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  title text not null,
  logged_at date not null,
  mileage integer default 0,
  notes text default '',
  cost numeric(12, 2)
);

create table if not exists public.dyno_results (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  logged_at date not null,
  horsepower integer not null,
  torque integer not null,
  boost_psi numeric(6, 1),
  notes text,
  sheet_url text
);

create table if not exists public.quarter_mile_times (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  logged_at date not null,
  et numeric(6, 3) not null,
  trap_speed numeric(6, 2) not null,
  reaction_time numeric(6, 3),
  notes text
);

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  url text not null,
  caption text,
  album text not null,
  created_at timestamptz default now()
);

create table if not exists public.follows (
  follower_id uuid references public.profiles (id) on delete cascade,
  following_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.build_likes (
  update_id uuid references public.build_updates (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (update_id, profile_id)
);

create table if not exists public.build_comments (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.build_updates (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.saved_builds (
  update_id uuid references public.build_updates (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (update_id, profile_id)
);

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.parts enable row level security;
alter table public.build_updates enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.dyno_results enable row level security;
alter table public.quarter_mile_times enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.follows enable row level security;
alter table public.build_likes enable row level security;
alter table public.build_comments enable row level security;
alter table public.saved_builds enable row level security;
alter table public.profile_badges enable row level security;
alter table public.badges enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Public vehicles are viewable by everyone"
  on public.vehicles for select using (true);

create policy "Owners manage vehicles"
  on public.vehicles for all using (auth.uid() = owner_id);

create policy "Public badges readable"
  on public.badges for select using (true);

create policy "Public profile badges readable"
  on public.profile_badges for select using (true);

create policy "Public garage content readable"
  on public.parts for select using (true);
create policy "Public build updates readable"
  on public.build_updates for select using (true);
create policy "Public maintenance readable"
  on public.maintenance_logs for select using (true);
create policy "Public dyno readable"
  on public.dyno_results for select using (true);
create policy "Public times readable"
  on public.quarter_mile_times for select using (true);
create policy "Public gallery readable"
  on public.gallery_photos for select using (true);
create policy "Public follows readable"
  on public.follows for select using (true);
create policy "Public likes readable"
  on public.build_likes for select using (true);
create policy "Public comments readable"
  on public.build_comments for select using (true);

create policy "Users manage own social graph"
  on public.follows for all using (auth.uid() = follower_id);

create policy "Users manage own likes"
  on public.build_likes for all using (auth.uid() = profile_id);

create policy "Users manage own saves"
  on public.saved_builds for all using (auth.uid() = profile_id);

create policy "Users manage own comments"
  on public.build_comments for all using (auth.uid() = author_id);

insert into public.badges (id, label, emoji, description) values
  ('first_build', 'First Build', '🏁', 'Logged the first vehicle build in the garage.'),
  ('weekend_wrench', 'Weekend Wrench', '🔧', 'Consistent weekend wrenching and journal updates.'),
  ('engine_builder', 'Engine Builder', '🔥', 'Documented a full engine build or swap.'),
  ('forced_induction', 'Forced Induction', '⚡', 'Completed a turbo or supercharger install.'),
  ('community_favorite', 'Community Favorite', '👑', 'High engagement across builds and updates.'),
  ('top_contributor', 'Top Contributor', '🏆', 'Top-tier contributions to the community feed.'),
  ('photographer', 'Photographer', '📸', 'Published a standout garage photo gallery.'),
  ('helpful_member', 'Helpful Member', '💯', 'Recognized for useful comments and advice.')
on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
