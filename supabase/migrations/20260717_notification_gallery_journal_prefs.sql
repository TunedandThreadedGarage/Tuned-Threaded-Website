-- Gallery photo likes + seed journal/gallery notification preference keys.

create table if not exists public.garage_photo_likes (
  photo_id uuid not null references public.garage_photos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);

create index if not exists garage_photo_likes_user_idx
  on public.garage_photo_likes (user_id);

alter table public.garage_photo_likes enable row level security;

drop policy if exists "Garage photo likes readable" on public.garage_photo_likes;
create policy "Garage photo likes readable"
  on public.garage_photo_likes for select
  using (true);

drop policy if exists "Garage photo likes insert own" on public.garage_photo_likes;
create policy "Garage photo likes insert own"
  on public.garage_photo_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Garage photo likes delete own" on public.garage_photo_likes;
create policy "Garage photo likes delete own"
  on public.garage_photo_likes for delete
  using (auth.uid() = user_id);

-- Extend default preference seeds with journal + gallery
create or replace function public.seed_notification_channel_preferences(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  keys text[] := array[
    'likes', 'comments', 'replies', 'mentions', 'followers', 'build_follows',
    'build_saves', 'shares', 'messages', 'journal', 'gallery', 'vehicle_tags',
    'trending', 'events', 'marketplace', 'orders', 'badges'
  ];
  k text;
begin
  foreach k in array keys loop
    insert into public.notification_channel_preferences (
      user_id, event_key, email_enabled, in_app_enabled, push_enabled
    ) values (
      p_user_id,
      k,
      case when k in ('followers', 'trending') then false else true end,
      true,
      false
    )
    on conflict (user_id, event_key) do nothing;
  end loop;
end;
$$;

-- Backfill new keys for existing users
do $$
declare
  r record;
begin
  for r in select id from public.profiles loop
    perform public.seed_notification_channel_preferences(r.id);
  end loop;
end;
$$;
