-- Private recipient emails for notification delivery (not exposed via PostgREST).
create schema if not exists private;

create table if not exists private.user_emails (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  updated_at timestamptz not null default now()
);

create table if not exists private.app_secrets (
  key text primary key,
  value text not null
);

-- Deployment must set notify_lookup + notify_worker_url via SQL / dashboard.
-- Fail closed: no default secret or production URL is committed.

create or replace function private.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = private, auth
as $$
begin
  if new.email is null then
    return new;
  end if;
  insert into private.user_emails (user_id, email, updated_at)
  values (new.id, lower(new.email), now())
  on conflict (user_id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists sync_user_email on auth.users;
create trigger sync_user_email
  after insert or update of email on auth.users
  for each row execute function private.sync_user_email();

-- Backfill existing users
insert into private.user_emails (user_id, email, updated_at)
select id, lower(email), now()
from auth.users
where email is not null
on conflict (user_id) do update
  set email = excluded.email,
      updated_at = now();

-- Server-only lookup: requires matching NOTIFY_LOOKUP_SECRET.
create or replace function public.get_notification_email(
  p_user_id uuid,
  p_secret text
)
returns text
language plpgsql
security definer
set search_path = private
as $$
declare
  expected text;
  result text;
begin
  select value into expected
  from private.app_secrets
  where key = 'notify_lookup';

  if expected is null or p_secret is null or p_secret <> expected then
    return null;
  end if;

  select email into result
  from private.user_emails
  where user_id = p_user_id;

  return result;
end;
$$;

revoke all on function public.get_notification_email(uuid, text) from public;
revoke all on function public.get_notification_email(uuid, text) from anon;
grant execute on function public.get_notification_email(uuid, text) to authenticated;
grant execute on function public.get_notification_email(uuid, text) to service_role;

-- Canonical preference seed (followers email on; trending off).
-- Uses ON CONFLICT DO NOTHING so existing user opt-outs are never rewritten.
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
      case when k = 'trending' then false else true end,
      true,
      false
    )
    on conflict (user_id, event_key) do nothing;
  end loop;
end;
$$;
