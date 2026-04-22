-- When the user opens the notifications page, we stamp this time so the header badge
-- only counts notifications created after their last visit.

alter table public.profiles
  add column if not exists notification_inbox_seen_at timestamptz;

comment on column public.profiles.notification_inbox_seen_at is
  'Updated when the user opens /notifications; badge counts rows with created_at greater than this.';
