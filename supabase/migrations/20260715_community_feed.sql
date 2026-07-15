-- Community social feed (additive — does not alter Garage tables)
-- Reuses public.follows for follow graph (do not duplicate).
-- Safe to re-run where practical.

do $$ begin
  create type public.community_post_type as enum (
    'photo',
    'video',
    'build_update',
    'maintenance',
    'dyno',
    'quarter_mile',
    'question',
    'discussion',
    'status'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  build_id uuid references public.builds (id) on delete set null,
  post_type public.community_post_type not null default 'status',
  title text,
  body text,
  media_urls text[] not null default '{}',
  video_url text,
  youtube_url text,
  tags text[] not null default '{}',
  manufacturer text,
  engine text,
  transmission text,
  horsepower int,
  state text,
  location text,
  is_public boolean not null default true,
  like_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_created_at_idx
  on public.community_posts (created_at desc);
create index if not exists community_posts_user_id_idx
  on public.community_posts (user_id, created_at desc);
create index if not exists community_posts_like_count_idx
  on public.community_posts (like_count desc, created_at desc);
create index if not exists community_posts_tags_gin_idx
  on public.community_posts using gin (tags);
create index if not exists community_posts_manufacturer_idx
  on public.community_posts (manufacturer);

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.community_comments (id) on delete cascade,
  body text not null,
  image_url text,
  like_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_comments_post_id_idx
  on public.community_comments (post_id, created_at);
create index if not exists community_comments_parent_id_idx
  on public.community_comments (parent_id);

drop trigger if exists community_comments_set_updated_at on public.community_comments;
create trigger community_comments_set_updated_at
  before update on public.community_comments
  for each row execute function public.set_updated_at();

create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.community_comment_likes (
  comment_id uuid not null references public.community_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table if not exists public.community_saved_posts (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.community_tags (
  key text primary key,
  label text not null,
  sort_order int not null default 0
);

insert into public.community_tags (key, label, sort_order) values
  ('ford', 'Ford', 10),
  ('chevy', 'Chevy', 20),
  ('dodge', 'Dodge', 30),
  ('toyota', 'Toyota', 40),
  ('honda', 'Honda', 50),
  ('nissan', 'Nissan', 60),
  ('bmw', 'BMW', 70),
  ('audi', 'Audi', 80),
  ('jdm', 'JDM', 90),
  ('muscle', 'Muscle', 100),
  ('truck', 'Truck', 110),
  ('motorcycle', 'Motorcycle', 120),
  ('turbo', 'Turbo', 130),
  ('supercharged', 'Supercharged', 140),
  ('na', 'Naturally Aspirated', 150),
  ('drag', 'Drag', 160),
  ('drift', 'Drift', 170),
  ('off_road', 'Off Road', 180)
on conflict (key) do nothing;

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null,
  post_id uuid references public.community_posts (id) on delete cascade,
  comment_id uuid references public.community_comments (id) on delete cascade,
  message text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_notifications_user_id_idx
  on public.community_notifications (user_id, created_at desc);

-- Counter helpers
create or replace function public.community_bump_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts
      set like_count = like_count + 1
      where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_posts
      set like_count = greatest(like_count - 1, 0)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_likes_count_ins on public.community_likes;
create trigger community_likes_count_ins
  after insert on public.community_likes
  for each row execute function public.community_bump_like_count();

drop trigger if exists community_likes_count_del on public.community_likes;
create trigger community_likes_count_del
  after delete on public.community_likes
  for each row execute function public.community_bump_like_count();

create or replace function public.community_bump_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts
      set comment_count = comment_count + 1
      where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_posts
      set comment_count = greatest(comment_count - 1, 0)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_comments_count_ins on public.community_comments;
create trigger community_comments_count_ins
  after insert on public.community_comments
  for each row execute function public.community_bump_comment_count();

drop trigger if exists community_comments_count_del on public.community_comments;
create trigger community_comments_count_del
  after delete on public.community_comments
  for each row execute function public.community_bump_comment_count();

-- RLS
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_comment_likes enable row level security;
alter table public.community_saved_posts enable row level security;
alter table public.community_tags enable row level security;
alter table public.community_notifications enable row level security;

drop policy if exists "Community posts readable" on public.community_posts;
create policy "Community posts readable"
  on public.community_posts for select
  using (is_public = true or auth.uid() = user_id);

drop policy if exists "Community posts insert own" on public.community_posts;
create policy "Community posts insert own"
  on public.community_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Community posts update own" on public.community_posts;
create policy "Community posts update own"
  on public.community_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Community posts delete own" on public.community_posts;
create policy "Community posts delete own"
  on public.community_posts for delete
  using (auth.uid() = user_id);

drop policy if exists "Community comments readable" on public.community_comments;
create policy "Community comments readable"
  on public.community_comments for select
  using (true);

drop policy if exists "Community comments insert own" on public.community_comments;
create policy "Community comments insert own"
  on public.community_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Community comments update own" on public.community_comments;
create policy "Community comments update own"
  on public.community_comments for update
  using (auth.uid() = user_id);

drop policy if exists "Community comments delete own" on public.community_comments;
create policy "Community comments delete own"
  on public.community_comments for delete
  using (auth.uid() = user_id);

drop policy if exists "Community likes readable" on public.community_likes;
create policy "Community likes readable"
  on public.community_likes for select using (true);

drop policy if exists "Community likes insert own" on public.community_likes;
create policy "Community likes insert own"
  on public.community_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Community likes delete own" on public.community_likes;
create policy "Community likes delete own"
  on public.community_likes for delete
  using (auth.uid() = user_id);

drop policy if exists "Community comment likes readable" on public.community_comment_likes;
create policy "Community comment likes readable"
  on public.community_comment_likes for select using (true);

drop policy if exists "Community comment likes insert own" on public.community_comment_likes;
create policy "Community comment likes insert own"
  on public.community_comment_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Community comment likes delete own" on public.community_comment_likes;
create policy "Community comment likes delete own"
  on public.community_comment_likes for delete
  using (auth.uid() = user_id);

drop policy if exists "Community saved readable own" on public.community_saved_posts;
create policy "Community saved readable own"
  on public.community_saved_posts for select
  using (auth.uid() = user_id);

drop policy if exists "Community saved insert own" on public.community_saved_posts;
create policy "Community saved insert own"
  on public.community_saved_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Community saved delete own" on public.community_saved_posts;
create policy "Community saved delete own"
  on public.community_saved_posts for delete
  using (auth.uid() = user_id);

drop policy if exists "Community tags readable" on public.community_tags;
create policy "Community tags readable"
  on public.community_tags for select using (true);

drop policy if exists "Community notifications readable own" on public.community_notifications;
create policy "Community notifications readable own"
  on public.community_notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Community notifications update own" on public.community_notifications;
create policy "Community notifications update own"
  on public.community_notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Community notifications insert" on public.community_notifications;
create policy "Community notifications insert"
  on public.community_notifications for insert
  with check (true);
