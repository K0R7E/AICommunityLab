-- Optional: create profiles for auth users created before the profiles trigger existed.
-- Run manually if needed after deploying 002_profiles_and_rls.sql.

insert into public.profiles (id, username, avatar_url)
select
  u.id,
  'user_' || left(replace(u.id::text, '-', ''), 12),
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
