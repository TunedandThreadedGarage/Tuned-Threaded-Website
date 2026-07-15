-- Flagship Builds hub (additive — does not alter Garage/Community app logic)
-- Safe to re-run where practical.

-- Extend builds
alter table public.builds add column if not exists cover_photo_url text;
alter table public.builds add column if not exists tags text[] not null default '{}';
alter table public.builds add column if not exists view_count int not null default 0;
alter table public.builds add column if not exists is_featured boolean not null default false;
alter table public.builds add column if not exists is_staff_pick boolean not null default false;
alter table public.builds add column if not exists labor_hours_cached numeric;
alter table public.builds add column if not exists invested_cents_cached int;

create index if not exists builds_public_created_at_idx
  on public.builds (is_public, created_at desc);
create index if not exists builds_public_updated_at_idx
  on public.builds (is_public, updated_at desc);
create index if not exists builds_view_count_idx
  on public.builds (view_count desc);
create index if not exists builds_featured_idx
  on public.builds (is_featured, updated_at desc)
  where is_featured = true;
create index if not exists builds_tags_gin_idx
  on public.builds using gin (tags);

-- Follow builds (separate from garage follows)
create table if not exists public.build_followers (
  build_id uuid not null references public.builds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (build_id, user_id)
);
create index if not exists build_followers_user_id_idx
  on public.build_followers (user_id);

-- Build timeline journal
create table if not exists public.build_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  entry_date date not null default current_date,
  photos text[] not null default '{}',
  video_url text,
  parts_installed text,
  cost_cents int,
  hours_spent numeric,
  stage text,
  like_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists build_timeline_entries_build_id_idx
  on public.build_timeline_entries (build_id, entry_date desc);

drop trigger if exists build_timeline_entries_set_updated_at on public.build_timeline_entries;
create trigger build_timeline_entries_set_updated_at
  before update on public.build_timeline_entries
  for each row execute function public.set_updated_at();

create table if not exists public.build_timeline_likes (
  entry_id uuid not null references public.build_timeline_entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id)
);

create table if not exists public.build_timeline_comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.build_timeline_entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists build_timeline_comments_entry_id_idx
  on public.build_timeline_comments (entry_id, created_at);

drop trigger if exists build_timeline_comments_set_updated_at on public.build_timeline_comments;
create trigger build_timeline_comments_set_updated_at
  before update on public.build_timeline_comments
  for each row execute function public.set_updated_at();

-- Gallery videos
create table if not exists public.build_videos (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists build_videos_build_id_idx
  on public.build_videos (build_id, sort_order);

-- Parts (installed + wishlist)
do $$ begin
  create type public.build_part_status as enum ('installed', 'wishlist');
exception when duplicate_object then null;
end $$;

create table if not exists public.build_parts (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  brand text,
  name text not null,
  price_cents int,
  purchase_url text,
  install_date date,
  status public.build_part_status not null default 'installed',
  priority int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists build_parts_build_id_idx
  on public.build_parts (build_id, status, priority);

-- Extra performance metrics (dyno/QM remain on vehicles)
do $$ begin
  create type public.build_perf_type as enum ('zero_sixty', 'top_speed', 'track');
exception when duplicate_object then null;
end $$;

create table if not exists public.build_performance (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  result_date date not null default current_date,
  perf_type public.build_perf_type not null,
  value_numeric numeric not null,
  unit text not null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists build_performance_build_id_idx
  on public.build_performance (build_id, result_date desc);

-- Goals (one row per build)
create table if not exists public.build_goals (
  build_id uuid primary key references public.builds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  current_goal text,
  next_goal text,
  long_term_goal text,
  budget_remaining_cents int,
  completion_pct int not null default 0
    check (completion_pct >= 0 and completion_pct <= 100),
  updated_at timestamptz not null default now()
);

drop trigger if exists build_goals_set_updated_at on public.build_goals;
create trigger build_goals_set_updated_at
  before update on public.build_goals
  for each row execute function public.set_updated_at();

-- Threaded build comments (additive)
alter table public.build_comments add column if not exists parent_id uuid
  references public.build_comments (id) on delete cascade;
alter table public.build_comments add column if not exists image_url text;
alter table public.build_comments add column if not exists like_count int not null default 0;

create table if not exists public.build_comment_likes (
  comment_id uuid not null references public.build_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- Timeline like counter
create or replace function public.build_timeline_bump_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.build_timeline_entries
      set like_count = like_count + 1 where id = new.entry_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.build_timeline_entries
      set like_count = greatest(like_count - 1, 0) where id = old.entry_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists build_timeline_likes_count_ins on public.build_timeline_likes;
create trigger build_timeline_likes_count_ins
  after insert on public.build_timeline_likes
  for each row execute function public.build_timeline_bump_like_count();

drop trigger if exists build_timeline_likes_count_del on public.build_timeline_likes;
create trigger build_timeline_likes_count_del
  after delete on public.build_timeline_likes
  for each row execute function public.build_timeline_bump_like_count();

-- RLS
alter table public.build_followers enable row level security;
alter table public.build_timeline_entries enable row level security;
alter table public.build_timeline_likes enable row level security;
alter table public.build_timeline_comments enable row level security;
alter table public.build_videos enable row level security;
alter table public.build_parts enable row level security;
alter table public.build_performance enable row level security;
alter table public.build_goals enable row level security;
alter table public.build_comment_likes enable row level security;

-- Followers
drop policy if exists "Build followers readable" on public.build_followers;
create policy "Build followers readable"
  on public.build_followers for select using (true);
drop policy if exists "Build followers insert own" on public.build_followers;
create policy "Build followers insert own"
  on public.build_followers for insert with check (auth.uid() = user_id);
drop policy if exists "Build followers delete own" on public.build_followers;
create policy "Build followers delete own"
  on public.build_followers for delete using (auth.uid() = user_id);

-- Timeline: readable if build public or owner
drop policy if exists "Build timeline readable" on public.build_timeline_entries;
create policy "Build timeline readable"
  on public.build_timeline_entries for select
  using (
    exists (
      select 1 from public.builds b
      where b.id = build_id and (b.is_public = true or b.user_id = auth.uid())
    )
  );
drop policy if exists "Build timeline insert own" on public.build_timeline_entries;
create policy "Build timeline insert own"
  on public.build_timeline_entries for insert
  with check (auth.uid() = user_id);
drop policy if exists "Build timeline update own" on public.build_timeline_entries;
create policy "Build timeline update own"
  on public.build_timeline_entries for update
  using (auth.uid() = user_id);
drop policy if exists "Build timeline delete own" on public.build_timeline_entries;
create policy "Build timeline delete own"
  on public.build_timeline_entries for delete
  using (auth.uid() = user_id);

drop policy if exists "Build timeline likes readable" on public.build_timeline_likes;
create policy "Build timeline likes readable"
  on public.build_timeline_likes for select using (true);
drop policy if exists "Build timeline likes insert own" on public.build_timeline_likes;
create policy "Build timeline likes insert own"
  on public.build_timeline_likes for insert with check (auth.uid() = user_id);
drop policy if exists "Build timeline likes delete own" on public.build_timeline_likes;
create policy "Build timeline likes delete own"
  on public.build_timeline_likes for delete using (auth.uid() = user_id);

drop policy if exists "Build timeline comments readable" on public.build_timeline_comments;
create policy "Build timeline comments readable"
  on public.build_timeline_comments for select using (true);
drop policy if exists "Build timeline comments insert own" on public.build_timeline_comments;
create policy "Build timeline comments insert own"
  on public.build_timeline_comments for insert with check (auth.uid() = user_id);
drop policy if exists "Build timeline comments delete own" on public.build_timeline_comments;
create policy "Build timeline comments delete own"
  on public.build_timeline_comments for delete using (auth.uid() = user_id);

-- Videos / parts / performance / goals — same public-or-owner pattern
drop policy if exists "Build videos readable" on public.build_videos;
create policy "Build videos readable"
  on public.build_videos for select
  using (
    exists (
      select 1 from public.builds b
      where b.id = build_id and (b.is_public = true or b.user_id = auth.uid())
    )
  );
drop policy if exists "Build videos insert own" on public.build_videos;
create policy "Build videos insert own"
  on public.build_videos for insert with check (auth.uid() = user_id);
drop policy if exists "Build videos update own" on public.build_videos;
create policy "Build videos update own"
  on public.build_videos for update using (auth.uid() = user_id);
drop policy if exists "Build videos delete own" on public.build_videos;
create policy "Build videos delete own"
  on public.build_videos for delete using (auth.uid() = user_id);

drop policy if exists "Build parts readable" on public.build_parts;
create policy "Build parts readable"
  on public.build_parts for select
  using (
    exists (
      select 1 from public.builds b
      where b.id = build_id and (b.is_public = true or b.user_id = auth.uid())
    )
  );
drop policy if exists "Build parts insert own" on public.build_parts;
create policy "Build parts insert own"
  on public.build_parts for insert with check (auth.uid() = user_id);
drop policy if exists "Build parts update own" on public.build_parts;
create policy "Build parts update own"
  on public.build_parts for update using (auth.uid() = user_id);
drop policy if exists "Build parts delete own" on public.build_parts;
create policy "Build parts delete own"
  on public.build_parts for delete using (auth.uid() = user_id);

drop policy if exists "Build performance readable" on public.build_performance;
create policy "Build performance readable"
  on public.build_performance for select
  using (
    exists (
      select 1 from public.builds b
      where b.id = build_id and (b.is_public = true or b.user_id = auth.uid())
    )
  );
drop policy if exists "Build performance insert own" on public.build_performance;
create policy "Build performance insert own"
  on public.build_performance for insert with check (auth.uid() = user_id);
drop policy if exists "Build performance update own" on public.build_performance;
create policy "Build performance update own"
  on public.build_performance for update using (auth.uid() = user_id);
drop policy if exists "Build performance delete own" on public.build_performance;
create policy "Build performance delete own"
  on public.build_performance for delete using (auth.uid() = user_id);

drop policy if exists "Build goals readable" on public.build_goals;
create policy "Build goals readable"
  on public.build_goals for select
  using (
    exists (
      select 1 from public.builds b
      where b.id = build_id and (b.is_public = true or b.user_id = auth.uid())
    )
  );
drop policy if exists "Build goals insert own" on public.build_goals;
create policy "Build goals insert own"
  on public.build_goals for insert with check (auth.uid() = user_id);
drop policy if exists "Build goals update own" on public.build_goals;
create policy "Build goals update own"
  on public.build_goals for update using (auth.uid() = user_id);
drop policy if exists "Build goals delete own" on public.build_goals;
create policy "Build goals delete own"
  on public.build_goals for delete using (auth.uid() = user_id);

drop policy if exists "Build comment likes readable" on public.build_comment_likes;
create policy "Build comment likes readable"
  on public.build_comment_likes for select using (true);
drop policy if exists "Build comment likes insert own" on public.build_comment_likes;
create policy "Build comment likes insert own"
  on public.build_comment_likes for insert with check (auth.uid() = user_id);
drop policy if exists "Build comment likes delete own" on public.build_comment_likes;
create policy "Build comment likes delete own"
  on public.build_comment_likes for delete using (auth.uid() = user_id);
