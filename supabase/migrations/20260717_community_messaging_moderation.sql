-- Community messaging, blocks, reports, and moderation flags.

-- Blocks
create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);

-- Direct messages
create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'request'
    check (status in ('inbox', 'request', 'declined')),
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dm_participants (
  conversation_id uuid not null references public.dm_conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  deleted_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists dm_participants_user_idx
  on public.dm_participants (user_id, deleted_at);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.dm_conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint dm_messages_has_content check (
    length(trim(body)) > 0 or image_url is not null
  )
);

create index if not exists dm_messages_conversation_idx
  on public.dm_messages (conversation_id, created_at desc);

-- Pair lookup helper: sorted pair uniqueness via generated key on participants
-- Enforced in app; optional unique index via function not required.

-- Content reports
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in (
    'profile', 'build', 'gallery_photo', 'journal_entry',
    'comment', 'dm_conversation', 'dm_message'
  )),
  target_id text not null,
  target_user_id uuid references public.profiles (id) on delete set null,
  reason text not null check (reason in (
    'harassment', 'hate_speech', 'spam', 'impersonation',
    'explicit', 'scam', 'other'
  )),
  details text,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

create index if not exists content_reports_status_idx
  on public.content_reports (status, created_at desc);

-- Auto moderation flags
create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id text not null,
  user_id uuid references public.profiles (id) on delete set null,
  category text not null,
  excerpt text,
  score int not null default 1,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

create index if not exists moderation_flags_status_idx
  on public.moderation_flags (status, created_at desc);

-- RLS
alter table public.user_blocks enable row level security;
alter table public.dm_conversations enable row level security;
alter table public.dm_participants enable row level security;
alter table public.dm_messages enable row level security;
alter table public.content_reports enable row level security;
alter table public.moderation_flags enable row level security;

-- Blocks
drop policy if exists "Blocks select own" on public.user_blocks;
create policy "Blocks select own"
  on public.user_blocks for select
  using (auth.uid() = blocker_id or auth.uid() = blocked_id);

drop policy if exists "Blocks insert own" on public.user_blocks;
create policy "Blocks insert own"
  on public.user_blocks for insert
  with check (auth.uid() = blocker_id);

drop policy if exists "Blocks delete own" on public.user_blocks;
create policy "Blocks delete own"
  on public.user_blocks for delete
  using (auth.uid() = blocker_id);

-- Helper: is participant
create or replace function public.is_dm_participant(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.dm_participants p
    where p.conversation_id = conv_id
      and p.user_id = auth.uid()
      and p.deleted_at is null
  );
$$;

-- Conversations: participants can select; insert allowed for auth (app validates)
drop policy if exists "DM conversations select" on public.dm_conversations;
create policy "DM conversations select"
  on public.dm_conversations for select
  using (public.is_dm_participant(id));

drop policy if exists "DM conversations insert" on public.dm_conversations;
create policy "DM conversations insert"
  on public.dm_conversations for insert
  with check (auth.uid() is not null);

drop policy if exists "DM conversations update" on public.dm_conversations;
create policy "DM conversations update"
  on public.dm_conversations for update
  using (public.is_dm_participant(id));

-- Participants
drop policy if exists "DM participants select" on public.dm_participants;
create policy "DM participants select"
  on public.dm_participants for select
  using (
    user_id = auth.uid()
    or public.is_dm_participant(conversation_id)
  );

drop policy if exists "DM participants insert" on public.dm_participants;
create policy "DM participants insert"
  on public.dm_participants for insert
  with check (auth.uid() is not null);

drop policy if exists "DM participants update own" on public.dm_participants;
create policy "DM participants update own"
  on public.dm_participants for update
  using (user_id = auth.uid());

-- Messages
drop policy if exists "DM messages select" on public.dm_messages;
create policy "DM messages select"
  on public.dm_messages for select
  using (public.is_dm_participant(conversation_id));

drop policy if exists "DM messages insert" on public.dm_messages;
create policy "DM messages insert"
  on public.dm_messages for insert
  with check (
    auth.uid() = sender_id
    and public.is_dm_participant(conversation_id)
  );

drop policy if exists "DM messages update own" on public.dm_messages;
create policy "DM messages update own"
  on public.dm_messages for update
  using (auth.uid() = sender_id);

-- Reports
drop policy if exists "Reports insert own" on public.content_reports;
create policy "Reports insert own"
  on public.content_reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Reports select own" on public.content_reports;
create policy "Reports select own"
  on public.content_reports for select
  using (auth.uid() = reporter_id);

-- Flags: insert via authenticated (scanner); select own for transparency
drop policy if exists "Flags insert auth" on public.moderation_flags;
create policy "Flags insert auth"
  on public.moderation_flags for insert
  with check (auth.uid() is not null);

drop policy if exists "Flags select own" on public.moderation_flags;
create policy "Flags select own"
  on public.moderation_flags for select
  using (auth.uid() = user_id);

-- Storage bucket for DM images
insert into storage.buckets (id, name, public)
values ('messages', 'messages', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Message images are public" on storage.objects;
create policy "Message images are public"
  on storage.objects for select
  using (bucket_id = 'messages');

drop policy if exists "Users upload own message media" on storage.objects;
create policy "Users upload own message media"
  on storage.objects for insert
  with check (
    bucket_id = 'messages'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own message media" on storage.objects;
create policy "Users delete own message media"
  on storage.objects for delete
  using (
    bucket_id = 'messages'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Realtime
alter table public.dm_messages replica identity full;
alter table public.dm_conversations replica identity full;
alter table public.dm_participants replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.dm_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.dm_conversations;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.dm_participants;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
