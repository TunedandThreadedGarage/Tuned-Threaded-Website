-- Expand Garage Journal into a full social journal hub.
alter table public.journal_entries
  add column if not exists visibility text not null default 'private'
    check (visibility in ('public', 'private')),
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published')),
  add column if not exists category text,
  add column if not exists media_urls text[] not null default '{}',
  add column if not exists build_id uuid references public.builds(id) on delete set null,
  add column if not exists like_count integer not null default 0,
  add column if not exists comment_count integer not null default 0;

create index if not exists journal_entries_visibility_idx
  on public.journal_entries (visibility, status, entry_date desc);
create index if not exists journal_entries_category_idx
  on public.journal_entries (category);
create index if not exists journal_entries_build_id_idx
  on public.journal_entries (build_id);

create table if not exists public.journal_likes (
  journal_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (journal_id, user_id)
);

create table if not exists public.journal_comments (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_comments_journal_id_idx
  on public.journal_comments (journal_id, created_at);

alter table public.journal_likes enable row level security;
alter table public.journal_comments enable row level security;

drop policy if exists "Journal likes read" on public.journal_likes;
create policy "Journal likes read" on public.journal_likes
  for select using (true);

drop policy if exists "Journal likes write own" on public.journal_likes;
create policy "Journal likes write own" on public.journal_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Journal comments read" on public.journal_comments;
create policy "Journal comments read" on public.journal_comments
  for select using (true);

drop policy if exists "Journal comments write own" on public.journal_comments;
create policy "Journal comments write own" on public.journal_comments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public can read published public journals; owners see all of theirs.
drop policy if exists "Journal owner only" on public.journal_entries;
create policy "Journal owner manage" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Journal public read" on public.journal_entries;
create policy "Journal public read" on public.journal_entries
  for select using (
    (visibility = 'public' and status = 'published')
    or auth.uid() = user_id
  );

drop trigger if exists journal_comments_set_updated_at on public.journal_comments;
create trigger journal_comments_set_updated_at
  before update on public.journal_comments
  for each row execute function set_updated_at();

create or replace function public.refresh_journal_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.journal_entries
  set like_count = (
    select count(*)::integer from public.journal_likes
    where journal_id = coalesce(new.journal_id, old.journal_id)
  )
  where id = coalesce(new.journal_id, old.journal_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists journal_likes_refresh_count on public.journal_likes;
create trigger journal_likes_refresh_count
  after insert or delete on public.journal_likes
  for each row execute function public.refresh_journal_like_count();

create or replace function public.refresh_journal_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.journal_entries
  set comment_count = (
    select count(*)::integer from public.journal_comments
    where journal_id = coalesce(new.journal_id, old.journal_id)
  )
  where id = coalesce(new.journal_id, old.journal_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists journal_comments_refresh_count on public.journal_comments;
create trigger journal_comments_refresh_count
  after insert or delete on public.journal_comments
  for each row execute function public.refresh_journal_comment_count();
