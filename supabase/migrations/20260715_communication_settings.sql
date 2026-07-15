-- Communication preferences, channel toggles, and richer order tracking.

create table if not exists public.communication_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  master_enabled boolean not null default true,
  email_frequency text not null default 'instant'
    check (email_frequency in ('instant', 'daily', 'weekly', 'never')),
  digest_daily boolean not null default false,
  digest_weekly boolean not null default true,
  digest_monthly boolean not null default false,
  marketing_merchandise boolean not null default true,
  marketing_sales boolean not null default true,
  marketing_events boolean not null default true,
  marketing_features boolean not null default true,
  marketing_community boolean not null default false,
  show_activity_status boolean not null default true,
  allow_mentions boolean not null default true,
  allow_messages_from text not null default 'everyone'
    check (allow_messages_from in ('everyone', 'followers', 'none')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_channel_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_key text not null,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  push_enabled boolean not null default false,
  primary key (user_id, event_key)
);

create index if not exists notification_channel_prefs_user_idx
  on public.notification_channel_preferences (user_id);

-- Seed helper: default channel rows for a user
create or replace function public.seed_notification_channel_preferences(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  keys text[] := array[
    'likes', 'comments', 'replies', 'mentions', 'followers', 'build_follows',
    'build_saves', 'shares', 'messages', 'vehicle_tags', 'trending',
    'events', 'marketplace', 'orders', 'badges'
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

create or replace function public.ensure_communication_settings(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.communication_settings (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
  perform public.seed_notification_channel_preferences(p_user_id);
end;
$$;

-- Extend new-user bootstrap (additive)
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

  perform public.ensure_communication_settings(new.id);

  return new;
end;
$$;

drop trigger if exists communication_settings_set_updated_at on public.communication_settings;
create trigger communication_settings_set_updated_at
  before update on public.communication_settings
  for each row execute function public.set_updated_at();

-- Order tracking columns
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists carrier text;
alter table public.orders add column if not exists estimated_delivery date;
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists refunded_at timestamptz;
alter table public.orders add column if not exists receipt_url text;
alter table public.orders add column if not exists invoice_url text;
alter table public.orders add column if not exists currency text not null default 'usd';

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_ref text not null,
  product_name text,
  product_image_url text,
  quantity int not null default 1 check (quantity > 0),
  unit_price_cents int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.communication_settings enable row level security;
alter table public.notification_channel_preferences enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Communication settings owner" on public.communication_settings;
create policy "Communication settings owner"
  on public.communication_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Notification channel prefs owner" on public.notification_channel_preferences;
create policy "Notification channel prefs owner"
  on public.notification_channel_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Order items owner" on public.order_items;
create policy "Order items owner"
  on public.order_items for all
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

grant execute on function public.seed_notification_channel_preferences(uuid) to authenticated;
grant execute on function public.ensure_communication_settings(uuid) to authenticated;

-- Backfill existing profiles
do $$
declare
  r record;
begin
  for r in select id from public.profiles loop
    perform public.ensure_communication_settings(r.id);
  end loop;
end $$;
