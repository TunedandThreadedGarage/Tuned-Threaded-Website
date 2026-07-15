-- Unified Notifications Center: richer payloads, delete RLS, realtime.

alter table public.notifications
  add column if not exists href text;

alter table public.notifications
  add column if not exists thumbnail_url text;

alter table public.notifications
  add column if not exists action text;

create index if not exists notifications_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

drop policy if exists "Notifications owner delete" on public.notifications;
create policy "Notifications owner delete"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Realtime (ignore if already published)
alter table public.notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
