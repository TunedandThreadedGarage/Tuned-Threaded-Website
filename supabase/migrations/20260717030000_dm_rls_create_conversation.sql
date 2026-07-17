-- Fix DM creation RLS chicken-and-egg:
-- insert().select() on dm_conversations requires SELECT, which required
-- is_dm_participant() before any participants existed.
--
-- Table name is dm_participants (not dm_conversation_members).

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

-- Atomic create: conversation + both participants (caller + peer).
create or replace function public.create_dm_conversation(
  peer_user_id uuid,
  initial_status text default 'request'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv_id uuid;
  existing_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if peer_user_id is null or peer_user_id = me then
    raise exception 'Invalid peer';
  end if;
  if not exists (select 1 from public.profiles where id = peer_user_id) then
    raise exception 'Peer not found';
  end if;
  if initial_status is null or initial_status not in ('inbox', 'request', 'declined') then
    raise exception 'Invalid status';
  end if;

  -- Reuse existing 1:1 conversation if present (including soft-deleted for caller).
  select p1.conversation_id into existing_id
  from public.dm_participants p1
  join public.dm_participants p2
    on p2.conversation_id = p1.conversation_id
   and p2.user_id = peer_user_id
  where p1.user_id = me
  limit 1;

  if existing_id is not null then
    update public.dm_participants
       set deleted_at = null
     where conversation_id = existing_id
       and user_id = me;
    update public.dm_conversations
       set status = case
             when status = 'declined' then initial_status
             else status
           end,
           updated_at = now()
     where id = existing_id;
    return existing_id;
  end if;

  insert into public.dm_conversations (status)
  values (initial_status)
  returning id into conv_id;

  insert into public.dm_participants (conversation_id, user_id)
  values
    (conv_id, me),
    (conv_id, peer_user_id);

  return conv_id;
end;
$$;

revoke all on function public.create_dm_conversation(uuid, text) from public;
grant execute on function public.create_dm_conversation(uuid, text) to authenticated;
grant execute on function public.create_dm_conversation(uuid, text) to service_role;

-- Conversations: keep insert for authenticated (fallback); select/update participants only.
drop policy if exists "DM conversations insert" on public.dm_conversations;
create policy "DM conversations insert"
  on public.dm_conversations for insert
  with check (auth.uid() is not null);

drop policy if exists "DM conversations select" on public.dm_conversations;
create policy "DM conversations select"
  on public.dm_conversations for select
  using (public.is_dm_participant(id));

drop policy if exists "DM conversations update" on public.dm_conversations;
create policy "DM conversations update"
  on public.dm_conversations for update
  using (public.is_dm_participant(id))
  with check (public.is_dm_participant(id));

-- Participants: users may only insert themselves (peer rows via RPC).
drop policy if exists "DM participants insert" on public.dm_participants;
create policy "DM participants insert"
  on public.dm_participants for insert
  with check (auth.uid() = user_id);

drop policy if exists "DM participants select" on public.dm_participants;
create policy "DM participants select"
  on public.dm_participants for select
  using (
    user_id = auth.uid()
    or public.is_dm_participant(conversation_id)
  );

drop policy if exists "DM participants update own" on public.dm_participants;
create policy "DM participants update own"
  on public.dm_participants for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Messages: participants only; sender must be self.
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
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);
