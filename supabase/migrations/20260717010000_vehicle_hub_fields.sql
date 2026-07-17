-- Vehicle hub fields for Garage vehicle editor.
alter table public.vehicles
  add column if not exists drivetrain text,
  add column if not exists vin text,
  add column if not exists paint_color text;

alter table public.vehicle_photos
  add column if not exists is_cover boolean not null default false;

create index if not exists vehicle_photos_cover_idx
  on public.vehicle_photos (vehicle_id, is_cover)
  where is_cover = true;
