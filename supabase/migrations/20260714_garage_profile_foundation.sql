-- Garage Profile foundation + full member schema
-- Apply in Supabase SQL Editor (or via CLI)

-- Extensions
create extension if not exists "pgcrypto";

-- Skill levels
do $$ begin
  create type public.skill_level as enum (
    'weekend_wrench',
    'home_mechanic',
    'builder',
    'pro_shop'
  );
exception when duplicate_object then null;
end $$;

-- Profiles (Garage Profile)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  banner_url text,
  bio text,
  location text,
  skill_level public.skill_level,
  settings jsonb not null default '{}'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (
    username is null or username ~ '^[a-z0-9_]{3,24}$'
  )
);

create index if not exists profiles_username_idx on public.profiles (username);

-- Vehicles
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  year int,
  make text not null,
  model text not null,
  trim text,
  notes text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_user_id_idx on public.vehicles (user_id);

-- Modifications
create table if not exists public.modifications (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists modifications_vehicle_id_idx on public.modifications (vehicle_id);

-- Builds
create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  title text not null,
  body text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists builds_user_id_idx on public.builds (user_id);

-- Build photos
create table if not exists public.build_photos (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists build_photos_build_id_idx on public.build_photos (build_id);

-- Garage Journal
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_entries_user_id_idx on public.journal_entries (user_id);

-- Follows
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null,
  entity_type text,
  entity_id uuid,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

-- Build likes
create table if not exists public.build_likes (
  build_id uuid not null references public.builds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (build_id, user_id)
);

-- Build comments
create table if not exists public.build_comments (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists build_comments_build_id_idx on public.build_comments (build_id);

-- Wishlist
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_ref text not null,
  product_name text,
  product_image_url text,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_ref)
);

-- Saved cart
create table if not exists public.saved_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.saved_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.saved_carts (id) on delete cascade,
  product_ref text not null,
  product_name text,
  quantity int not null default 1 check (quantity > 0),
  unit_price_cents int,
  created_at timestamptz not null default now(),
  unique (cart_id, product_ref)
);

-- Orders placeholder (pre-shop)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'placeholder',
  total_cents int not null default 0,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

drop trigger if exists builds_set_updated_at on public.builds;
create trigger builds_set_updated_at
  before update on public.builds
  for each row execute function public.set_updated_at();

drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- New user → profile + wishlist + cart
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.wishlists (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.saved_carts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.modifications enable row level security;
alter table public.builds enable row level security;
alter table public.build_photos enable row level security;
alter table public.journal_entries enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.build_likes enable row level security;
alter table public.build_comments enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.saved_carts enable row level security;
alter table public.saved_cart_items enable row level security;
alter table public.orders enable row level security;

-- Profiles policies
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Vehicles
drop policy if exists "Vehicles readable" on public.vehicles;
create policy "Vehicles readable"
  on public.vehicles for select using (true);

drop policy if exists "Vehicles owner write" on public.vehicles;
create policy "Vehicles owner write"
  on public.vehicles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Modifications
drop policy if exists "Mods readable" on public.modifications;
create policy "Mods readable"
  on public.modifications for select using (true);

drop policy if exists "Mods owner write" on public.modifications;
create policy "Mods owner write"
  on public.modifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Builds
drop policy if exists "Public builds readable" on public.builds;
create policy "Public builds readable"
  on public.builds for select
  using (is_public = true or auth.uid() = user_id);

drop policy if exists "Builds owner write" on public.builds;
create policy "Builds owner write"
  on public.builds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Build photos
drop policy if exists "Build photos readable" on public.build_photos;
create policy "Build photos readable"
  on public.build_photos for select
  using (
    exists (
      select 1 from public.builds b
      where b.id = build_id and (b.is_public = true or b.user_id = auth.uid())
    )
  );

drop policy if exists "Build photos owner write" on public.build_photos;
create policy "Build photos owner write"
  on public.build_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Journal (private to owner)
drop policy if exists "Journal owner only" on public.journal_entries;
create policy "Journal owner only"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Follows
drop policy if exists "Follows readable" on public.follows;
create policy "Follows readable"
  on public.follows for select using (true);

drop policy if exists "Follows insert own" on public.follows;
create policy "Follows insert own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Follows delete own" on public.follows;
create policy "Follows delete own"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- Notifications
drop policy if exists "Notifications owner read" on public.notifications;
create policy "Notifications owner read"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Notifications owner update" on public.notifications;
create policy "Notifications owner update"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Notifications insert authenticated" on public.notifications;
create policy "Notifications insert authenticated"
  on public.notifications for insert
  with check (auth.uid() is not null);

-- Likes
drop policy if exists "Likes readable" on public.build_likes;
create policy "Likes readable"
  on public.build_likes for select using (true);

drop policy if exists "Likes insert own" on public.build_likes;
create policy "Likes insert own"
  on public.build_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Likes delete own" on public.build_likes;
create policy "Likes delete own"
  on public.build_likes for delete
  using (auth.uid() = user_id);

-- Comments
drop policy if exists "Comments readable" on public.build_comments;
create policy "Comments readable"
  on public.build_comments for select using (true);

drop policy if exists "Comments insert own" on public.build_comments;
create policy "Comments insert own"
  on public.build_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Comments update own" on public.build_comments;
create policy "Comments update own"
  on public.build_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Comments delete own" on public.build_comments;
create policy "Comments delete own"
  on public.build_comments for delete
  using (auth.uid() = user_id);

-- Wishlist
drop policy if exists "Wishlist owner" on public.wishlists;
create policy "Wishlist owner"
  on public.wishlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Wishlist items owner" on public.wishlist_items;
create policy "Wishlist items owner"
  on public.wishlist_items for all
  using (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
  );

-- Saved cart
drop policy if exists "Cart owner" on public.saved_carts;
create policy "Cart owner"
  on public.saved_carts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Cart items owner" on public.saved_cart_items;
create policy "Cart items owner"
  on public.saved_cart_items for all
  using (
    exists (select 1 from public.saved_carts c where c.id = cart_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.saved_carts c where c.id = cart_id and c.user_id = auth.uid())
  );

-- Orders
drop policy if exists "Orders owner" on public.orders;
create policy "Orders owner"
  on public.orders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('builds', 'builds', true)
on conflict (id) do nothing;

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
