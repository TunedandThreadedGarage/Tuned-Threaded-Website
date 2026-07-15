-- Community reputation badge catalog (additive)
insert into public.badges (key, label, description, sort_order) values
  ('beginner', 'Beginner', 'New to the Tuned & Threaded community.', 5),
  ('fabricator', 'Fabricator', 'Hands-on fabrication and custom work.', 35),
  ('track_veteran', 'Track Veteran', 'Logged track or quarter-mile results.', 45),
  ('master_builder', 'Master Builder', 'Top-tier reputation across the garage.', 90)
on conflict (key) do nothing;

-- Feed performance helpers
create index if not exists community_posts_comment_count_idx
  on public.community_posts (comment_count desc, created_at desc);

create index if not exists community_posts_state_idx
  on public.community_posts (state);
