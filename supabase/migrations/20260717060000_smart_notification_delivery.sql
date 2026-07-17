-- Smart notification delivery: multi-tab presence + durable delayed email queue
-- with automatic cancellation when the user returns / reads content.
--
-- Ops (required before emails can be processed):
--   insert into private.app_secrets (key, value) values
--     ('notify_lookup', '<same as NOTIFY_LOOKUP_SECRET>'),
--     ('notify_worker_url', 'https://www.example.com/api/notifications/process-queue')
--   on conflict (key) do update set value = excluded.value;

-- ============================================================
-- Presence: per-tab connections + aggregated user status
-- ============================================================
create table if not exists public.user_presence_connections (
  connection_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'online'
    check (status in ('online', 'away', 'offline')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, connection_id)
);

create index if not exists user_presence_connections_seen_idx
  on public.user_presence_connections (last_seen_at);

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'offline'
    check (status in ('online', 'away', 'offline')),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;
alter table public.user_presence_connections enable row level security;

drop policy if exists "Presence readable" on public.user_presence;
create policy "Presence readable"
  on public.user_presence for select
  to authenticated
  using (true);

-- Connection rows are only written via security-definer RPCs.
drop policy if exists "Presence connections readable own" on public.user_presence_connections;
create policy "Presence connections readable own"
  on public.user_presence_connections for select
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- Delayed email queue (private: only reachable via definer functions)
-- ============================================================
create table if not exists private.notification_email_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_id uuid,
  conversation_id uuid,
  type text not null,
  event_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'cancelled', 'failed')),
  cancel_reason text,
  error text,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  provider_message_id text,
  idempotency_key text not null,
  send_after timestamptz not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_email_queue_idempotency_unique unique (idempotency_key)
);

create index if not exists notification_email_queue_due_idx
  on private.notification_email_queue (send_after)
  where status = 'pending';

create index if not exists notification_email_queue_user_pending_idx
  on private.notification_email_queue (user_id)
  where status = 'pending';

create index if not exists notification_email_queue_sending_idx
  on private.notification_email_queue (claimed_at)
  where status = 'sending';

-- One pending email per user + event category (Discord-style batching).
create unique index if not exists notification_email_queue_pending_event_uidx
  on private.notification_email_queue (user_id, event_key)
  where status = 'pending';

-- ============================================================
-- Structured delivery audit log
-- ============================================================
create table if not exists private.notification_delivery_events (
  id bigserial primary key,
  queue_id uuid references private.notification_email_queue (id) on delete set null,
  user_id uuid,
  notification_type text,
  event text not null,
  presence_state text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notification_delivery_events_queue_idx
  on private.notification_delivery_events (queue_id, created_at desc);

create index if not exists notification_delivery_events_user_idx
  on private.notification_delivery_events (user_id, created_at desc);

create or replace function private.log_delivery_event(
  p_event text,
  p_user_id uuid default null,
  p_queue_id uuid default null,
  p_type text default null,
  p_presence text default null,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = private
as $$
begin
  insert into private.notification_delivery_events (
    queue_id, user_id, notification_type, event, presence_state, details
  ) values (
    p_queue_id, p_user_id, p_type, p_event, p_presence, coalesce(p_details, '{}'::jsonb)
  );
end;
$$;

-- ============================================================
-- Aggregate presence from fresh connection rows
-- ============================================================
create or replace function private.recompute_user_presence(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, private
as $$
declare
  agg text := 'offline';
  seen timestamptz := now();
  prev text;
begin
  -- Drop stale connections (offline heartbeats older than 2 min, or any > 12 min).
  delete from public.user_presence_connections
  where user_id = p_user_id
    and (
      last_seen_at < now() - interval '12 minutes'
      or (status = 'offline' and last_seen_at < now() - interval '2 minutes')
    );

  if exists (
    select 1 from public.user_presence_connections
    where user_id = p_user_id
      and status = 'online'
      and last_seen_at > now() - interval '2 minutes'
  ) then
    agg := 'online';
  elsif exists (
    select 1 from public.user_presence_connections
    where user_id = p_user_id
      and status = 'away'
      and last_seen_at > now() - interval '10 minutes'
  ) then
    agg := 'away';
  else
    agg := 'offline';
  end if;

  select max(last_seen_at) into seen
  from public.user_presence_connections
  where user_id = p_user_id;
  if seen is null then
    seen := now();
  end if;

  select status into prev
  from public.user_presence
  where user_id = p_user_id;

  insert into public.user_presence (user_id, status, last_seen_at, updated_at)
  values (p_user_id, agg, seen, now())
  on conflict (user_id) do update
    set status = excluded.status,
        last_seen_at = excluded.last_seen_at,
        updated_at = now();

  return agg;
end;
$$;

-- ============================================================
-- Cancel helper
-- ============================================================
create or replace function private.cancel_queued_emails(
  p_user_id uuid,
  p_reason text,
  p_conversation_id uuid default null,
  p_notification_id uuid default null,
  p_all_messages boolean default false
)
returns integer
language plpgsql
security definer
set search_path = private
as $$
declare
  affected integer := 0;
  r record;
begin
  for r in
    update private.notification_email_queue q
    set status = 'cancelled',
        cancel_reason = p_reason,
        updated_at = now()
    where q.user_id = p_user_id
      and q.status = 'pending'
      and (
        (p_all_messages and q.conversation_id is not null)
        or (p_conversation_id is not null and q.conversation_id = p_conversation_id)
        or (p_notification_id is not null and q.notification_id = p_notification_id)
        or (
          p_conversation_id is null
          and p_notification_id is null
          and not p_all_messages
        )
      )
    returning q.id, q.type
  loop
    affected := affected + 1;
    perform private.log_delivery_event(
      'email_cancelled',
      p_user_id,
      r.id,
      r.type,
      null,
      jsonb_build_object('reason', p_reason)
    );
  end loop;

  return affected;
end;
$$;

-- ============================================================
-- Heartbeat: upsert connection; recompute aggregate; cancel on online
-- ============================================================
create or replace function public.update_user_presence(
  p_status text,
  p_connection_id text default 'default'
)
returns text
language plpgsql
security definer
set search_path = public, private
as $$
declare
  uid uuid := auth.uid();
  agg text;
  cancelled integer;
begin
  if uid is null then
    return null;
  end if;
  if p_status not in ('online', 'away', 'offline') then
    return null;
  end if;
  if p_connection_id is null or length(trim(p_connection_id)) = 0 then
    p_connection_id := 'default';
  end if;

  insert into public.user_presence_connections (
    connection_id, user_id, status, last_seen_at
  ) values (
    left(p_connection_id, 64), uid, p_status, now()
  )
  on conflict (user_id, connection_id) do update
    set status = excluded.status,
        last_seen_at = now();

  agg := private.recompute_user_presence(uid);

  if agg = 'online' then
    cancelled := private.cancel_queued_emails(uid, 'user_returned');
    perform private.log_delivery_event(
      'presence_online',
      uid,
      null,
      null,
      agg,
      jsonb_build_object(
        'connection_id', p_connection_id,
        'cancelled', coalesce(cancelled, 0)
      )
    );
  end if;

  return agg;
end;
$$;

revoke all on function public.update_user_presence(text, text) from public;
grant execute on function public.update_user_presence(text, text) to authenticated;

-- Back-compat single-arg overload
create or replace function public.update_user_presence(p_status text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.update_user_presence(p_status, 'default');
end;
$$;

revoke all on function public.update_user_presence(text) from public;
grant execute on function public.update_user_presence(text) to authenticated;

-- Cancel pending DM emails when the user opens the Messages inbox.
create or replace function public.cancel_pending_message_emails()
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return 0;
  end if;
  return private.cancel_queued_emails(
    uid, 'messages_opened', null, null, true
  );
end;
$$;

revoke all on function public.cancel_pending_message_emails() from public;
grant execute on function public.cancel_pending_message_emails() to authenticated;

-- ============================================================
-- Queue an email (service_role only — called by the Next.js notification service)
-- ============================================================
create or replace function public.queue_notification_email(
  p_user_id uuid,
  p_type text,
  p_event_key text,
  p_payload jsonb,
  p_delay_seconds integer,
  p_notification_id uuid default null,
  p_conversation_id uuid default null,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = private
as $$
declare
  existing uuid;
  new_id uuid;
  key text;
begin
  if p_user_id is null or p_type is null or p_delay_seconds is null then
    return null;
  end if;

  key := coalesce(
    nullif(trim(p_idempotency_key), ''),
    p_user_id::text || ':' || p_event_key || ':' || coalesce(p_notification_id::text, p_conversation_id::text, gen_random_uuid()::text)
  );

  -- Exact idempotency hit (already queued / sent / cancelled for this key).
  select id into existing
  from private.notification_email_queue
  where idempotency_key = key
  limit 1;
  if existing is not null then
    return existing;
  end if;

  -- Dedupe: one pending email per user + event category.
  select id into existing
  from private.notification_email_queue
  where user_id = p_user_id
    and event_key = p_event_key
    and status = 'pending'
  limit 1;

  if existing is not null then
    update private.notification_email_queue
    set payload = coalesce(p_payload, payload),
        notification_id = coalesce(p_notification_id, notification_id),
        conversation_id = coalesce(p_conversation_id, conversation_id),
        -- Keep the earlier send_after (do not delay further on new events).
        updated_at = now()
    where id = existing;
    return existing;
  end if;

  begin
    insert into private.notification_email_queue (
      user_id, notification_id, conversation_id, type, event_key,
      payload, send_after, idempotency_key
    ) values (
      p_user_id, p_notification_id, p_conversation_id, p_type, p_event_key,
      coalesce(p_payload, '{}'::jsonb),
      now() + make_interval(secs => greatest(p_delay_seconds, 0)),
      key
    )
    returning id into new_id;
  exception when unique_violation then
    select id into new_id
    from private.notification_email_queue
    where user_id = p_user_id
      and event_key = p_event_key
      and status = 'pending'
    limit 1;
    if new_id is null then
      select id into new_id
      from private.notification_email_queue
      where idempotency_key = key
      limit 1;
    end if;
    return new_id;
  end;

  perform private.log_delivery_event(
    'email_queued',
    p_user_id,
    new_id,
    p_type,
    null,
    jsonb_build_object(
      'delay_seconds', p_delay_seconds,
      'event_key', p_event_key,
      'notification_id', p_notification_id,
      'conversation_id', p_conversation_id
    )
  );

  return new_id;
end;
$$;

revoke all on function public.queue_notification_email(uuid, text, text, jsonb, integer, uuid, uuid, text) from public;
revoke all on function public.queue_notification_email(uuid, text, text, jsonb, integer, uuid, uuid, text) from anon;
grant execute on function public.queue_notification_email(uuid, text, text, jsonb, integer, uuid, uuid, text) to authenticated;
grant execute on function public.queue_notification_email(uuid, text, text, jsonb, integer, uuid, uuid, text) to service_role;

-- Back-compat 7-arg overload for older callers
create or replace function public.queue_notification_email(
  p_user_id uuid,
  p_type text,
  p_event_key text,
  p_payload jsonb,
  p_delay_seconds integer,
  p_notification_id uuid default null,
  p_conversation_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.queue_notification_email(
    p_user_id, p_type, p_event_key, p_payload, p_delay_seconds,
    p_notification_id, p_conversation_id, null
  );
end;
$$;

revoke all on function public.queue_notification_email(uuid, text, text, jsonb, integer, uuid, uuid) from public;
revoke all on function public.queue_notification_email(uuid, text, text, jsonb, integer, uuid, uuid) from anon;
grant execute on function public.queue_notification_email(uuid, text, text, jsonb, integer, uuid, uuid) to authenticated;
grant execute on function public.queue_notification_email(uuid, text, text, jsonb, integer, uuid, uuid) to service_role;

-- ============================================================
-- Cancellation triggers
-- ============================================================

create or replace function private.on_notification_read()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
begin
  perform private.cancel_queued_emails(
    new.user_id, 'notification_read', null, new.id
  );
  return new;
end;
$$;

drop trigger if exists notification_read_cancel_email on public.notifications;
create trigger notification_read_cancel_email
  after update of read_at on public.notifications
  for each row
  when (new.read_at is not null and old.read_at is null)
  execute function private.on_notification_read();

create or replace function private.on_notification_deleted()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
begin
  perform private.cancel_queued_emails(
    old.user_id, 'notification_dismissed', null, old.id
  );
  return old;
end;
$$;

drop trigger if exists notification_delete_cancel_email on public.notifications;
create trigger notification_delete_cancel_email
  after delete on public.notifications
  for each row
  execute function private.on_notification_deleted();

create or replace function private.on_conversation_read()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
declare
  affected integer;
begin
  if new.last_read_at is not null then
    update private.notification_email_queue q
    set status = 'cancelled',
        cancel_reason = 'message_read',
        updated_at = now()
    where q.user_id = new.user_id
      and q.conversation_id = new.conversation_id
      and q.status = 'pending'
      and q.created_at <= new.last_read_at;
    get diagnostics affected = row_count;

    if affected > 0 then
      perform private.log_delivery_event(
        'email_cancelled',
        new.user_id,
        null,
        'message',
        null,
        jsonb_build_object(
          'reason', 'message_read',
          'conversation_id', new.conversation_id,
          'cancelled', affected
        )
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists conversation_read_cancel_email on public.dm_participants;
create trigger conversation_read_cancel_email
  after update of last_read_at on public.dm_participants
  for each row
  execute function private.on_conversation_read();

-- Preference disable → cancel pending for that event key immediately.
create or replace function private.on_channel_pref_disabled()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
declare
  r record;
begin
  if new.email_enabled = false and coalesce(old.email_enabled, true) = true then
    for r in
      update private.notification_email_queue q
      set status = 'cancelled',
          cancel_reason = 'preference_disabled',
          updated_at = now()
      where q.user_id = new.user_id
        and q.event_key = new.event_key
        and q.status = 'pending'
      returning q.id, q.type
    loop
      perform private.log_delivery_event(
        'email_cancelled',
        new.user_id,
        r.id,
        r.type,
        null,
        jsonb_build_object('reason', 'preference_disabled', 'event_key', new.event_key)
      );
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists channel_pref_cancel_email on public.notification_channel_preferences;
create trigger channel_pref_cancel_email
  after update of email_enabled on public.notification_channel_preferences
  for each row
  execute function private.on_channel_pref_disabled();

create or replace function private.on_master_pref_disabled()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
begin
  if (new.master_enabled = false and coalesce(old.master_enabled, true) = true)
     or (new.email_frequency is distinct from 'instant' and old.email_frequency = 'instant')
  then
    perform private.cancel_queued_emails(new.user_id, 'preference_disabled');
  end if;
  return new;
end;
$$;

drop trigger if exists master_pref_cancel_email on public.communication_settings;
create trigger master_pref_cancel_email
  after update of master_enabled, email_frequency on public.communication_settings
  for each row
  execute function private.on_master_pref_disabled();

-- ============================================================
-- Queue processing (claim + finalize), service_role only
-- ============================================================
create or replace function public.claim_due_notification_emails(
  p_limit integer default 20
)
returns table (
  id uuid,
  user_id uuid,
  type text,
  event_key text,
  payload jsonb,
  email text,
  idempotency_key text,
  attempts integer
)
language plpgsql
security definer
set search_path = private, public
as $$
begin
  -- Recover stale sending locks (worker crash) → pending with backoff.
  update private.notification_email_queue q
  set status = case
        when q.attempts >= q.max_attempts then 'failed'
        else 'pending'
      end,
      error = case
        when q.attempts >= q.max_attempts then 'stale_claim_exhausted'
        else 'stale_claim_requeued'
      end,
      send_after = case
        when q.attempts >= q.max_attempts then q.send_after
        else now() + make_interval(secs => least(900, greatest(30, q.attempts * 30)))
      end,
      claimed_at = null,
      updated_at = now()
  where q.status = 'sending'
    and q.claimed_at is not null
    and q.claimed_at < now() - interval '5 minutes';

  -- Cancel due rows that are no longer valid.

  -- Recipient came back online (fresh aggregate).
  update private.notification_email_queue q
  set status = 'cancelled', cancel_reason = 'user_active', updated_at = now()
  where q.status = 'pending'
    and q.send_after <= now()
    and exists (
      select 1 from public.user_presence up
      where up.user_id = q.user_id
        and up.status = 'online'
        and up.last_seen_at > now() - interval '2 minutes'
    );

  -- Notification already read.
  update private.notification_email_queue q
  set status = 'cancelled', cancel_reason = 'notification_read', updated_at = now()
  where q.status = 'pending'
    and q.send_after <= now()
    and q.notification_id is not null
    and exists (
      select 1 from public.notifications n
      where n.id = q.notification_id and n.read_at is not null
    );

  -- DM already read.
  update private.notification_email_queue q
  set status = 'cancelled', cancel_reason = 'message_read', updated_at = now()
  where q.status = 'pending'
    and q.send_after <= now()
    and q.conversation_id is not null
    and exists (
      select 1 from public.dm_participants p
      where p.user_id = q.user_id
        and p.conversation_id = q.conversation_id
        and p.last_read_at is not null
        and p.last_read_at >= q.created_at
    );

  -- Preferences changed since queueing.
  update private.notification_email_queue q
  set status = 'cancelled', cancel_reason = 'preference_disabled', updated_at = now()
  where q.status = 'pending'
    and q.send_after <= now()
    and (
      exists (
        select 1 from public.communication_settings cs
        where cs.user_id = q.user_id
          and (cs.master_enabled = false or cs.email_frequency <> 'instant')
      )
      or exists (
        select 1 from public.notification_channel_preferences np
        where np.user_id = q.user_id
          and np.event_key = q.event_key
          and np.email_enabled = false
      )
    );

  return query
  with claimed as (
    update private.notification_email_queue q
    set status = 'sending',
        claimed_at = now(),
        attempts = q.attempts + 1,
        updated_at = now()
    where q.id in (
      select q2.id from private.notification_email_queue q2
      where q2.status = 'pending' and q2.send_after <= now()
      order by q2.send_after
      limit greatest(p_limit, 1)
      for update skip locked
    )
    returning q.id, q.user_id, q.type, q.event_key, q.payload, q.idempotency_key, q.attempts
  )
  select c.id, c.user_id, c.type, c.event_key, c.payload, ue.email,
         c.idempotency_key, c.attempts
  from claimed c
  left join private.user_emails ue on ue.user_id = c.user_id;
end;
$$;

revoke all on function public.claim_due_notification_emails(integer) from public;
revoke all on function public.claim_due_notification_emails(integer) from anon;
revoke all on function public.claim_due_notification_emails(integer) from authenticated;
grant execute on function public.claim_due_notification_emails(integer) to service_role;

-- Secret-guarded wrapper for anon cron callers that do not have service_role.
create or replace function public.claim_due_notification_emails(
  p_secret text,
  p_limit integer default 20
)
returns table (
  id uuid,
  user_id uuid,
  type text,
  event_key text,
  payload jsonb,
  email text,
  idempotency_key text,
  attempts integer
)
language plpgsql
security definer
set search_path = private, public
as $$
declare
  expected text;
begin
  select value into expected
  from private.app_secrets
  where key = 'notify_lookup';

  if expected is null or p_secret is null or p_secret <> expected then
    return;
  end if;

  return query
  select * from public.claim_due_notification_emails(p_limit);
end;
$$;

revoke all on function public.claim_due_notification_emails(text, integer) from public;
-- Secret is checked inside the function body.
grant execute on function public.claim_due_notification_emails(text, integer) to anon;
grant execute on function public.claim_due_notification_emails(text, integer) to authenticated;
grant execute on function public.claim_due_notification_emails(text, integer) to service_role;

create or replace function public.finalize_notification_email(
  p_id uuid,
  p_status text,
  p_error text default null,
  p_provider_message_id text default null
)
returns void
language plpgsql
security definer
set search_path = private
as $$
declare
  row_user uuid;
  row_type text;
  row_attempts integer;
  row_max integer;
begin
  if p_status not in ('sent', 'failed', 'cancelled', 'pending') then
    return;
  end if;

  select user_id, type, attempts, max_attempts
    into row_user, row_type, row_attempts, row_max
  from private.notification_email_queue
  where id = p_id and status = 'sending';

  if row_user is null then
    return;
  end if;

  if p_status = 'failed' and row_attempts < row_max then
    -- Retry with exponential backoff (30s, 60s, 90s… capped at 15m).
    update private.notification_email_queue
    set status = 'pending',
        error = p_error,
        send_after = now() + make_interval(
          secs => least(900, greatest(30, row_attempts * 30))
        ),
        claimed_at = null,
        updated_at = now()
    where id = p_id and status = 'sending';

    perform private.log_delivery_event(
      'email_retry',
      row_user,
      p_id,
      row_type,
      null,
      jsonb_build_object('error', p_error, 'attempt', row_attempts)
    );
    return;
  end if;

  update private.notification_email_queue
  set status = p_status,
      error = p_error,
      provider_message_id = coalesce(p_provider_message_id, provider_message_id),
      claimed_at = case when p_status = 'pending' then null else claimed_at end,
      updated_at = now()
  where id = p_id and status = 'sending';

  perform private.log_delivery_event(
    case
      when p_status = 'sent' then 'email_sent'
      when p_status = 'cancelled' then 'email_cancelled'
      else 'email_failed'
    end,
    row_user,
    p_id,
    row_type,
    null,
    jsonb_build_object(
      'error', p_error,
      'provider_message_id', p_provider_message_id,
      'attempt', row_attempts
    )
  );
end;
$$;

revoke all on function public.finalize_notification_email(uuid, text, text, text) from public;
revoke all on function public.finalize_notification_email(uuid, text, text, text) from anon;
revoke all on function public.finalize_notification_email(uuid, text, text, text) from authenticated;
grant execute on function public.finalize_notification_email(uuid, text, text, text) to service_role;

-- Secret-guarded finalize for transitional callers
create or replace function public.finalize_notification_email(
  p_secret text,
  p_id uuid,
  p_status text,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = private, public
as $$
declare
  expected text;
begin
  select value into expected
  from private.app_secrets
  where key = 'notify_lookup';

  if expected is null or p_secret is null or p_secret <> expected then
    return;
  end if;

  perform public.finalize_notification_email(p_id, p_status, p_error, null);
end;
$$;

revoke all on function public.finalize_notification_email(text, uuid, text, text) from public;
grant execute on function public.finalize_notification_email(text, uuid, text, text) to anon;
grant execute on function public.finalize_notification_email(text, uuid, text, text) to authenticated;
grant execute on function public.finalize_notification_email(text, uuid, text, text) to service_role;

-- ============================================================
-- Scheduler: pg_cron pings the queue processor every minute.
-- Fail closed when notify_worker_url / notify_lookup are unset.
-- ============================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function private.invoke_notification_email_worker()
returns void
language plpgsql
security definer
set search_path = private, net, cron
as $$
declare
  worker_url text;
  secret text;
begin
  select value into worker_url
  from private.app_secrets
  where key = 'notify_worker_url';

  select value into secret
  from private.app_secrets
  where key = 'notify_lookup';

  if worker_url is null or secret is null then
    -- Fail closed: do not call an unknown endpoint.
    return;
  end if;

  perform net.http_post(
    url := worker_url,
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', secret
    ),
    timeout_milliseconds := 55000
  );
end;
$$;

do $$
begin
  perform cron.unschedule('process-notification-emails');
exception when others then
  null;
end;
$$;

select cron.schedule(
  'process-notification-emails',
  '* * * * *',
  $cron$ select private.invoke_notification_email_worker(); $cron$
);
