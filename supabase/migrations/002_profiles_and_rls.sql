-- Profiles synced from auth.users + stricter RLS for posts/votes/profiles

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  avatar_url text,
  bio text,
  website text,
  created_at timestamptz not null default now(),
  constraint profiles_username_key unique (username),
  constraint profiles_username_format check (
    username ~ '^[a-z0-9_]{3,32}$'
  )
);

create index idx_profiles_username on public.profiles (username);

comment on table public.profiles is 'Public user profile; created automatically on signup.';

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup (security definer)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  slug text;
  uname text;
begin
  base := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'user'
  );
  slug := lower(regexp_replace(base, '[^a-zA-Z0-9]+', '_', 'g'));
  slug := regexp_replace(slug, '^_+|_+$', '', 'g');
  if slug is null or slug = '' or length(slug) < 3 then
    slug := 'user';
  end if;
  if length(slug) > 22 then
    slug := left(slug, 22);
  end if;
  uname := slug || '_' || left(replace(new.id::text, '-', ''), 8);

  insert into public.profiles (id, username, avatar_url)
  values (new.id, uname, new.raw_user_meta_data->>'avatar_url');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Posts: owner UPDATE / DELETE
-- ---------------------------------------------------------------------------

create policy "Owners update own posts"
  on public.posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owners delete own posts"
  on public.posts
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Profiles RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "Anyone can read profiles"
  on public.profiles
  for select
  using (true);

create policy "Users update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
