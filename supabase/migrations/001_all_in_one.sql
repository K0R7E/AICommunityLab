-- ===== BEGIN 001_initial.sql =====

-- AICommunityLab — initial schema (run in Supabase SQL Editor or via CLI)
-- Requires: Supabase project with auth.users

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  category text not null,
  votes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  constraint unique_vote unique (user_id, post_id)
);

-- ---------------------------------------------------------------------------
-- Indexes (performance)
-- ---------------------------------------------------------------------------

create index idx_posts_created_at on public.posts (created_at desc);
create index idx_posts_votes_count on public.posts (votes_count desc);
create index idx_votes_post_id on public.votes (post_id);
create index idx_comments_post_id on public.comments (post_id);

-- ---------------------------------------------------------------------------
-- Maintain denormalized counts (concurrency-safe via row locks on posts)
-- ---------------------------------------------------------------------------

create or replace function public.increment_post_votes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set votes_count = votes_count + 1
  where id = new.post_id;
  return new;
end;
$$;

create or replace function public.decrement_post_votes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set votes_count = greatest(0, votes_count - 1)
  where id = old.post_id;
  return old;
end;
$$;

create trigger tr_votes_after_insert
  after insert on public.votes
  for each row
  execute function public.increment_post_votes_count();

create trigger tr_votes_after_delete
  after delete on public.votes
  for each row
  execute function public.decrement_post_votes_count();

create or replace function public.increment_post_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set comments_count = comments_count + 1
  where id = new.post_id;
  return new;
end;
$$;

create or replace function public.decrement_post_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set comments_count = greatest(0, comments_count - 1)
  where id = old.post_id;
  return old;
end;
$$;

create trigger tr_comments_after_insert
  after insert on public.comments
  for each row
  execute function public.increment_post_comments_count();

create trigger tr_comments_after_delete
  after delete on public.comments
  for each row
  execute function public.decrement_post_comments_count();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;

create policy "Anyone can read posts"
  on public.posts
  for select
  using (true);

create policy "Authenticated users insert own posts"
  on public.posts
  for insert
  with check (auth.uid() = user_id);

create policy "Anyone can read comments"
  on public.comments
  for select
  using (true);

create policy "Authenticated users insert own comments"
  on public.comments
  for insert
  with check (auth.uid() = user_id);

create policy "Users read own votes"
  on public.votes
  for select
  using (auth.uid() = user_id);

create policy "Users insert own votes"
  on public.votes
  for insert
  with check (auth.uid() = user_id);

create policy "Users delete own votes"
  on public.votes
  for delete
  using (auth.uid() = user_id);

-- ===== END 001_initial.sql =====


-- ===== BEGIN 002_profiles_and_rls.sql =====

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

-- ===== END 002_profiles_and_rls.sql =====


-- ===== BEGIN 003_backfill_profiles.sql =====

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

-- ===== END 003_backfill_profiles.sql =====


-- ===== BEGIN 004_api_grants_public.sql =====

-- PostgREST / Supabase JS kliens a `anon` és `authenticated` szerepkörökkel éri el a táblákat.
-- Ha a táblák SQL Editorból készültek és hiányoznak a grantek, 403-at kapsz: "permission denied for schema public".

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;

-- Később létrehozott táblákra is (ha a migrációt a postgres szerepkör futtatja)
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;

-- ===== END 004_api_grants_public.sql =====


-- ===== BEGIN 005_ratings_1_to_5.sql =====

-- Replace binary votes with per-user ratings 1–5 (updatable). Migrates old upvotes as rating value 5.

-- ---------------------------------------------------------------------------
-- New columns on posts (alongside legacy votes_count until migration completes)
-- ---------------------------------------------------------------------------

alter table public.posts
  add column if not exists rating_sum integer not null default 0,
  add column if not exists rating_count integer not null default 0;

-- ---------------------------------------------------------------------------
-- ratings: one row per user per post, value 1–5
-- ---------------------------------------------------------------------------

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ratings_value_range check (value >= 1 and value <= 5),
  constraint ratings_user_post unique (user_id, post_id)
);

create index idx_ratings_post_id on public.ratings (post_id);

-- Migrate existing upvotes → rating 5 (positive legacy “like”)
insert into public.ratings (post_id, user_id, value)
select post_id, user_id, 5
from public.votes
on conflict (user_id, post_id) do nothing;

-- Backfill aggregates from ratings (source of truth)
update public.posts p
set
  rating_sum = coalesce(s.s, 0),
  rating_count = coalesce(s.c, 0)
from (
  select
    post_id,
    sum(value)::integer as s,
    count(*)::integer as c
  from public.ratings
  group by post_id
) s
where p.id = s.post_id;

-- Drop legacy votes (triggers + table)
drop trigger if exists tr_votes_after_insert on public.votes;
drop trigger if exists tr_votes_after_delete on public.votes;
drop function if exists public.increment_post_votes_count () cascade;
drop function if exists public.decrement_post_votes_count () cascade;
drop table if exists public.votes cascade;

drop index if exists public.idx_votes_post_id;

alter table public.posts drop column if exists votes_count;

-- Average for sorting / display (maintained implicitly via sum & count)
alter table public.posts
  add column rating_avg double precision generated always as (
    case
      when rating_count > 0 then (rating_sum::double precision / rating_count::double precision)
      else null
    end
  ) stored;

drop index if exists public.idx_posts_votes_count;
create index idx_posts_rating_avg on public.posts (rating_avg desc nulls last);

-- ---------------------------------------------------------------------------
-- Triggers: keep rating_sum / rating_count in sync
-- ---------------------------------------------------------------------------

create or replace function public.apply_rating_to_post ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set
      rating_sum = rating_sum + new.value,
      rating_count = rating_count + 1
    where id = new.post_id;
    return new;
  elsif tg_op = 'UPDATE' then
    update public.posts
    set rating_sum = rating_sum - old.value + new.value
    where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts
    set
      rating_sum = greatest (0, rating_sum - old.value),
      rating_count = greatest (0, rating_count - 1)
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger tr_ratings_after_insert
  after insert on public.ratings
  for each row
  execute function public.apply_rating_to_post ();

create trigger tr_ratings_after_update
  after update on public.ratings
  for each row
  execute function public.apply_rating_to_post ();

create trigger tr_ratings_after_delete
  after delete on public.ratings
  for each row
  execute function public.apply_rating_to_post ();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.ratings enable row level security;

create policy "Users read own ratings"
  on public.ratings for select
  using (auth.uid() = user_id);

create policy "Users insert own ratings"
  on public.ratings for insert
  with check (auth.uid() = user_id);

create policy "Users update own ratings"
  on public.ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own ratings"
  on public.ratings for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- API grants (if 004 was applied earlier, grant new table explicitly)
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on table public.ratings to anon, authenticated;

-- ===== END 005_ratings_1_to_5.sql =====


-- ===== BEGIN 006_revoke_anon_writes.sql =====

-- Defense in depth: unauthenticated clients should not hold INSERT/UPDATE/DELETE
-- on app tables; RLS already restricts data, but this limits damage from new tables
-- that might ship without policies. Triggers and SECURITY DEFINER routines are
-- unaffected. SELECT remains for public read paths using the anon key.

revoke insert, update, delete on table public.posts from anon;
revoke insert, update, delete on table public.comments from anon;
revoke insert, update, delete on table public.profiles from anon;
revoke insert, update, delete on table public.ratings from anon;

-- ===== END 006_revoke_anon_writes.sql =====


-- ===== BEGIN 007_admin_moderation.sql =====

-- Admin flag + comment delete (owner + admin) + admin post delete

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create policy "Owners delete own comments"
  on public.comments
  for delete
  using (auth.uid() = user_id);

create policy "Admins delete any comment"
  on public.comments
  for delete
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Admins delete any post"
  on public.posts
  for delete
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ===== END 007_admin_moderation.sql =====


-- ===== BEGIN 008_post_image_url.sql =====

alter table public.posts
  add column if not exists image_url text;

-- ===== END 008_post_image_url.sql =====


-- ===== BEGIN 009_notifications.sql =====

-- In-app notifications when someone comments on your post (not the commenter)

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null default 'comment_on_post',
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_created on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users read own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.notify_post_author_on_comment ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_id uuid;
begin
  select p.user_id into author_id from public.posts p where p.id = new.post_id;
  if author_id is not null and author_id <> new.user_id then
    insert into public.notifications (user_id, type, post_id, comment_id)
    values (author_id, 'comment_on_post', new.post_id, new.id);
  end if;
  return new;
end;
$$;

create trigger tr_comments_notify_post_author
  after insert on public.comments
  for each row
  execute function public.notify_post_author_on_comment ();

revoke all on table public.notifications from anon;
revoke insert, delete on table public.notifications from authenticated;
grant select, update on table public.notifications to authenticated;

-- ===== END 009_notifications.sql =====


-- ===== BEGIN 010_admin_update_posts_comments.sql =====

-- Admins may edit any post or comment (moderation)

create policy "Admins update any post"
  on public.posts
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Admins update any comment"
  on public.comments
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ===== END 010_admin_update_posts_comments.sql =====


-- ===== BEGIN 011_post_moderation_and_admin_comment_notify.sql =====

-- Post moderation queue + stricter comment/rating visibility + notify all admins on every comment

-- ---------------------------------------------------------------------------
-- posts.moderation_status: pending (new) | published (feed) | rejected
-- ---------------------------------------------------------------------------

alter table public.posts
  add column if not exists moderation_status text;

update public.posts
set moderation_status = 'published'
where moderation_status is null;

alter table public.posts
  alter column moderation_status set not null,
  alter column moderation_status set default 'pending';

alter table public.posts
  drop constraint if exists posts_moderation_status_check;

alter table public.posts
  add constraint posts_moderation_status_check check (
    moderation_status in ('pending', 'published', 'rejected')
  );

-- New user submissions stay pending (overrides any client-sent value)
create or replace function public.force_new_post_pending ()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.moderation_status := 'pending';
  return new;
end;
$$;

drop trigger if exists tr_posts_force_pending on public.posts;

create trigger tr_posts_force_pending
  before insert on public.posts
  for each row
  execute function public.force_new_post_pending ();

-- Only admins may change moderation_status (others silently keep old value)
create or replace function public.enforce_post_moderation_status_change ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.moderation_status is not distinct from old.moderation_status then
    return new;
  end if;
  if exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  ) then
    return new;
  end if;
  new.moderation_status := old.moderation_status;
  return new;
end;
$$;

drop trigger if exists tr_posts_moderation_guard on public.posts;

create trigger tr_posts_moderation_guard
  before update on public.posts
  for each row
  execute function public.enforce_post_moderation_status_change ();

-- ---------------------------------------------------------------------------
-- RLS: posts — public sees published only; authors and admins see all theirs / all
-- ---------------------------------------------------------------------------

drop policy if exists "Anyone can read posts" on public.posts;

create policy "Read posts by visibility"
  on public.posts for select
  using (
    moderation_status = 'published'
    or auth.uid() = user_id
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: comments — readable only if post is visible to reader; insert only on published posts
-- ---------------------------------------------------------------------------

drop policy if exists "Anyone can read comments" on public.comments;

create policy "Read comments on visible posts"
  on public.comments for select
  using (
    exists (
      select 1
      from public.posts p
      where p.id = comments.post_id
        and (
          p.moderation_status = 'published'
          or auth.uid() = p.user_id
          or exists (
            select 1
            from public.profiles pr
            where pr.id = auth.uid() and pr.is_admin = true
          )
        )
    )
  );

drop policy if exists "Authenticated users insert own comments" on public.comments;

create policy "Insert comments on published posts only"
  on public.comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.posts p
      where p.id = post_id and p.moderation_status = 'published'
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: ratings — only rate published tools
-- ---------------------------------------------------------------------------

drop policy if exists "Users insert own ratings" on public.ratings;

create policy "Users insert own ratings on published posts"
  on public.ratings for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.posts p
      where p.id = post_id and p.moderation_status = 'published'
    )
  );

-- ---------------------------------------------------------------------------
-- Notify all admins on every new comment (except self if admin comments)
-- ---------------------------------------------------------------------------

create or replace function public.notify_admins_on_comment ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, post_id, comment_id)
  select pr.id, 'admin_new_comment', new.post_id, new.id
  from public.profiles pr
  where pr.is_admin = true
    and pr.id <> new.user_id;
  return new;
end;
$$;

drop trigger if exists tr_comments_notify_admins on public.comments;

create trigger tr_comments_notify_admins
  after insert on public.comments
  for each row
  execute function public.notify_admins_on_comment ();

-- ===== END 011_post_moderation_and_admin_comment_notify.sql =====


-- ===== BEGIN 012_posts_categories_array_optional_url.sql =====

-- Multiple categories per post (text[]) and optional tool URL.

alter table public.posts add column if not exists categories text[];

update public.posts
set categories = array[category]::text[]
where categories is null;

alter table public.posts alter column categories set not null;

alter table public.posts
  add constraint posts_categories_nonempty
  check (coalesce(array_length(categories, 1), 0) >= 1);

alter table public.posts drop column category;

alter table public.posts alter column url drop not null;

update public.posts
set url = null
where url is not null and btrim(url) = '';

create index if not exists posts_categories_gin on public.posts using gin (categories);

-- ===== END 012_posts_categories_array_optional_url.sql =====


-- ===== BEGIN 013_notifications_scale.sql =====

-- Scalable notifications: admin post queue, aggregated admin comment digests per post,
-- opt-in "new published tool" feed alerts, author publish notice.

-- ---------------------------------------------------------------------------
-- profiles: opt-in for feed-wide new-tool notifications (default off at scale)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists notify_new_tools boolean not null default false;

comment on column public.profiles.notify_new_tools is
  'When true, user gets one notification per newly published community tool (off by default for large sites).';

-- ---------------------------------------------------------------------------
-- notifications: batch_count for aggregated admin comment digests
-- ---------------------------------------------------------------------------

alter table public.notifications
  add column if not exists batch_count integer;

comment on column public.notifications.batch_count is
  'For admin_post_comments_digest: number of new comments since last read/reset; null treated as 1.';

-- ---------------------------------------------------------------------------
-- Admins: one row per new submission (moderation queue)
-- ---------------------------------------------------------------------------

create or replace function public.notify_admins_on_new_post ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, post_id)
  select pr.id, 'admin_new_post', new.id
  from public.profiles pr
  where pr.is_admin = true
    and pr.id is distinct from new.user_id;
  return new;
end;
$$;

drop trigger if exists tr_posts_notify_admins_new on public.posts;

create trigger tr_posts_notify_admins_new
  after insert on public.posts
  for each row
  execute function public.notify_admins_on_new_post ();

-- ---------------------------------------------------------------------------
-- When a post becomes published: author + opt-in feed subscribers
-- ---------------------------------------------------------------------------

create or replace function public.notify_on_post_published ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.moderation_status = 'published'
     and old.moderation_status is distinct from new.moderation_status
     and old.moderation_status is distinct from 'published' then

    insert into public.notifications (user_id, type, post_id)
    select pr.id, 'new_tool_in_feed', new.id
    from public.profiles pr
    where pr.notify_new_tools = true
      and pr.id is distinct from new.user_id
      and coalesce(pr.is_admin, false) = false;

    insert into public.notifications (user_id, type, post_id)
    values (new.user_id, 'your_post_published', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists tr_posts_notify_on_published on public.posts;

create trigger tr_posts_notify_on_published
  after update on public.posts
  for each row
  execute function public.notify_on_post_published ();

-- ---------------------------------------------------------------------------
-- Admins: aggregate comments per post (avoids N rows per comment at scale)
-- ---------------------------------------------------------------------------

create or replace function public.notify_admins_on_comment ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n_updated bigint;
begin
  for r in
    select pr.id as admin_id
    from public.profiles pr
    where pr.is_admin = true
      and pr.id <> new.user_id
  loop
    update public.notifications n
    set
      batch_count = case
        when n.read_at is not null then 1
        else coalesce(n.batch_count, 1) + 1
      end,
      read_at = null,
      created_at = now()
    where n.user_id = r.admin_id
      and n.post_id = new.post_id
      and n.type = 'admin_post_comments_digest';

    get diagnostics n_updated = row_count;
    if n_updated = 0 then
      insert into public.notifications (user_id, type, post_id, comment_id, batch_count)
      values (r.admin_id, 'admin_post_comments_digest', new.post_id, null, 1);
    end if;
  end loop;
  return new;
end;
$$;

-- ===== END 013_notifications_scale.sql =====


-- ===== BEGIN 014_moderation_messages_notifications.sql =====

-- Optional moderator message on post rejection; user notifications for rejections
-- and comment removals. RPC for admins to insert notifications for other users.

alter table public.posts
  add column if not exists moderation_rejection_reason text;

alter table public.notifications
  add column if not exists message text;

comment on column public.posts.moderation_rejection_reason is
  'Shown to the post author when a submission is rejected (via notification).';

comment on column public.notifications.message is
  'Optional note (e.g. moderation reason).';

-- Notify post author when submission moves to rejected
create or replace function public.notify_author_post_rejected ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.moderation_status = 'rejected'
     and old.moderation_status is distinct from 'rejected'
     and new.user_id is not null then
    insert into public.notifications (user_id, type, post_id, message)
    values (
      new.user_id,
      'post_rejected',
      new.id,
      nullif(trim(coalesce(new.moderation_rejection_reason, '')), '')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tr_posts_notify_author_rejected on public.posts;

create trigger tr_posts_notify_author_rejected
  after update on public.posts
  for each row
  execute function public.notify_author_post_rejected ();

-- Admins only: insert a moderation notification for another user (e.g. before comment delete)
create or replace function public.moderation_push_notification (
  p_user_id uuid,
  p_type text,
  p_post_id uuid,
  p_message text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  if not exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid() and pr.is_admin = true
  ) then
    return;
  end if;
  if p_user_id is null or p_user_id = auth.uid() then
    return;
  end if;

  insert into public.notifications (user_id, type, post_id, message)
  values (
    p_user_id,
    p_type,
    p_post_id,
    nullif(trim(coalesce(p_message, '')), '')
  );
end;
$$;

revoke all on function public.moderation_push_notification (uuid, text, uuid, text) from public;
grant execute on function public.moderation_push_notification (uuid, text, uuid, text) to authenticated;

-- ===== END 014_moderation_messages_notifications.sql =====


-- ===== BEGIN 015_duplicate_prevention.sql =====

-- Duplicate prevention: canonical URL uniqueness + pg_trgm similarity RPC for no-URL submits.

create extension if not exists pg_trgm;

alter table public.posts
  add column if not exists url_canonical text;

comment on column public.posts.url_canonical is
  'Normalized https URL for dedup; set by application on write.';

create unique index if not exists posts_url_canonical_unique_pending_published
  on public.posts (url_canonical)
  where
    url_canonical is not null
    and moderation_status in ('pending', 'published');

create index if not exists posts_title_trgm
  on public.posts using gin (title gin_trgm_ops);

create index if not exists posts_description_trgm
  on public.posts using gin (description gin_trgm_ops)
  where description is not null and btrim(description) <> '';

-- Similar listings for submit flow (pending + published only; excludes rejected).
create or replace function public.find_similar_posts_for_submit (
  p_title text,
  p_description text,
  p_max_results int default 8
)
returns table (
  id uuid,
  title text,
  excerpt text,
  moderation_status text,
  score double precision
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  t text := lower(btrim(coalesce(p_title, '')));
  d text := lower(btrim(coalesce(p_description, '')));
  lim int := greatest(1, least(coalesce(p_max_results, 8), 24));
begin
  if length(t) < 3 then
    return;
  end if;

  return query
  select
    p.id,
    p.title,
    left(coalesce(p.description, ''), 240) as excerpt,
    p.moderation_status,
    (
      case
        when length(d) < 5 then
          similarity(lower(btrim(p.title)), t)::double precision
        else greatest(
          0.62 * similarity(lower(btrim(p.title)), t) + 0.38 * similarity(
            lower(btrim(coalesce(p.description, ''))),
            d
          ),
          similarity(lower(btrim(p.title)), t)::double precision
        )
      end
    ) as score
  from public.posts p
  where p.moderation_status in ('pending', 'published')
    and (
      similarity(lower(btrim(p.title)), t) > 0.12
      or (
        length(d) >= 5
        and similarity(lower(btrim(coalesce(p.description, ''))), d) > 0.12
      )
    )
  order by score desc
  limit lim;
end;
$$;

revoke all on function public.find_similar_posts_for_submit (text, text, int) from public;
grant execute on function public.find_similar_posts_for_submit (text, text, int) to authenticated;

-- ===== END 015_duplicate_prevention.sql =====


-- ===== BEGIN 016_notifications_user_delete.sql =====

-- Allow users to delete (dismiss) their own notifications from the inbox.

drop policy if exists "Users delete own notifications" on public.notifications;

create policy "Users delete own notifications"
  on public.notifications
  for delete
  using (auth.uid() = user_id);

grant delete on table public.notifications to authenticated;

-- ===== END 016_notifications_user_delete.sql =====


-- ===== BEGIN 017_profiles_notification_inbox_seen_at.sql =====

-- When the user opens the notifications page, we stamp this time so the header badge
-- only counts notifications created after their last visit.

alter table public.profiles
  add column if not exists notification_inbox_seen_at timestamptz;

comment on column public.profiles.notification_inbox_seen_at is
  'Updated when the user opens /notifications; badge counts rows with created_at greater than this.';

-- ===== END 017_profiles_notification_inbox_seen_at.sql =====


-- ===== BEGIN 018_feed_search_published_posts_rpc.sql =====

-- Feed search: fuzzy matching via pg_trgm over published posts.

create extension if not exists pg_trgm;

create index if not exists posts_url_trgm
  on public.posts using gin (url gin_trgm_ops)
  where url is not null and btrim(url) <> '';

create index if not exists comments_content_trgm
  on public.comments using gin (content gin_trgm_ops);

create or replace function public.search_published_posts (
  p_query text,
  p_category_labels text[] default null,
  p_cursor timestamptz default null,
  p_limit int default 20
)
returns table (
  id uuid,
  rank_score double precision
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q text := lower(btrim(coalesce(p_query, '')));
  q_like text := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  lim int := greatest(1, least(coalesce(p_limit, 20), 100));
  trigram_threshold double precision := case when length(q) < 4 then 0.18 else 0.12 end;
begin
  if length(q) < 2 then
    return;
  end if;

  return query
  with candidates as (
    select
      p.id,
      p.created_at,
      (
        greatest(
          1.20 * similarity(lower(p.title), q),
          0.90 * similarity(lower(coalesce(p.description, '')), q),
          0.70 * similarity(lower(coalesce(p.url, '')), q)
        )
        + case when lower(p.title) like q || '%' then 0.35 else 0 end
        + case when lower(p.title) like q_like escape '\' then 0.08 else 0 end
        + case
            when exists (
              select 1
              from unnest(coalesce(p.categories, '{}'::text[])) as category
              where lower(category) like q_like escape '\'
            ) then 0.10
            else 0
          end
        + case
            when exists (
              select 1
              from public.comments c
              where c.post_id = p.id
                and (
                  similarity(lower(c.content), q) > trigram_threshold
                  or lower(c.content) like q_like escape '\'
                )
            ) then 0.06
            else 0
          end
      )::double precision as score
    from public.posts p
    where p.moderation_status = 'published'
      and (p_cursor is null or p.created_at < p_cursor)
      and (
        p_category_labels is null
        or cardinality(p_category_labels) = 0
        or p.categories && p_category_labels
      )
      and (
        similarity(lower(p.title), q) > trigram_threshold
        or similarity(lower(coalesce(p.description, '')), q) > trigram_threshold
        or similarity(lower(coalesce(p.url, '')), q) > trigram_threshold
        or lower(p.title) like q_like escape '\'
        or lower(coalesce(p.description, '')) like q_like escape '\'
        or lower(coalesce(p.url, '')) like q_like escape '\'
        or exists (
          select 1
          from unnest(coalesce(p.categories, '{}'::text[])) as category
          where lower(category) like q_like escape '\'
        )
        or exists (
          select 1
          from public.comments c
          where c.post_id = p.id
            and (
              similarity(lower(c.content), q) > trigram_threshold
              or lower(c.content) like q_like escape '\'
            )
        )
      )
  )
  select
    candidates.id,
    candidates.score as rank_score
  from candidates
  order by candidates.score desc, candidates.created_at desc, candidates.id desc
  limit lim;
end;
$$;

revoke all on function public.search_published_posts (text, text[], timestamptz, int) from public;
grant execute on function public.search_published_posts (text, text[], timestamptz, int) to anon, authenticated;

-- ===== END 018_feed_search_published_posts_rpc.sql =====


-- ===== BEGIN 019_drop_posts_image_url.sql =====

alter table public.posts
  drop column if exists image_url;

-- ===== END 019_drop_posts_image_url.sql =====


-- ===== BEGIN 020_owner_post_update_delete.sql =====

-- Allow authors to edit/delete only their own posts.

drop policy if exists "Owners update own post" on public.posts;
create policy "Owners update own post"
  on public.posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Owners delete own post" on public.posts;
create policy "Owners delete own post"
  on public.posts
  for delete
  using (auth.uid() = user_id);

-- ===== END 020_owner_post_update_delete.sql =====


-- ===== BEGIN 021_notification_preferences_and_rpc_hardening.sql =====

-- Extend per-user notification preferences and harden moderation RPC contract.

alter table public.profiles
  add column if not exists notify_comments_on_tools boolean not null default true,
  add column if not exists notify_moderation_updates boolean not null default true;

comment on column public.profiles.notify_comments_on_tools is
  'When true, user gets notifications when someone comments on their tool.';

comment on column public.profiles.notify_moderation_updates is
  'When true, user gets moderation lifecycle notifications (publish/reject/comment removed).';

create or replace function public.notify_post_author_on_comment ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_id uuid;
begin
  select p.user_id into author_id from public.posts p where p.id = new.post_id;
  if author_id is not null
     and author_id <> new.user_id
     and exists (
       select 1
       from public.profiles pr
       where pr.id = author_id
         and coalesce(pr.notify_comments_on_tools, true) = true
     ) then
    insert into public.notifications (user_id, type, post_id, comment_id)
    values (author_id, 'comment_on_post', new.post_id, new.id);
  end if;
  return new;
end;
$$;

create or replace function public.notify_on_post_published ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.moderation_status = 'published'
     and old.moderation_status is distinct from new.moderation_status
     and old.moderation_status is distinct from 'published' then

    insert into public.notifications (user_id, type, post_id)
    select pr.id, 'new_tool_in_feed', new.id
    from public.profiles pr
    where pr.notify_new_tools = true
      and pr.id is distinct from new.user_id
      and coalesce(pr.is_admin, false) = false;

    insert into public.notifications (user_id, type, post_id)
    select new.user_id, 'your_post_published', new.id
    where exists (
      select 1
      from public.profiles pr
      where pr.id = new.user_id
        and coalesce(pr.notify_moderation_updates, true) = true
    );
  end if;
  return new;
end;
$$;

create or replace function public.notify_author_post_rejected ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.moderation_status = 'rejected'
     and old.moderation_status is distinct from 'rejected'
     and new.user_id is not null
     and exists (
       select 1
       from public.profiles pr
       where pr.id = new.user_id
         and coalesce(pr.notify_moderation_updates, true) = true
     ) then
    insert into public.notifications (user_id, type, post_id, message)
    values (
      new.user_id,
      'post_rejected',
      new.id,
      nullif(trim(coalesce(new.moderation_rejection_reason, '')), '')
    );
  end if;
  return new;
end;
$$;

create or replace function public.moderation_push_notification (
  p_user_id uuid,
  p_type text,
  p_post_id uuid,
  p_message text
) returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return 'skipped';
  end if;
  if not exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid() and pr.is_admin = true
  ) then
    return 'skipped';
  end if;
  if p_user_id is null or p_user_id = auth.uid() then
    return 'skipped';
  end if;
  if p_type is null or p_type <> all (array['comment_removed', 'post_rejected']) then
    raise exception 'Invalid p_type for moderation_push_notification'
      using errcode = '22023',
            hint = 'Allowed values: comment_removed, post_rejected';
  end if;
  if p_post_id is null then
    raise exception 'p_post_id is required'
      using errcode = '22023';
  end if;
  if p_type in ('comment_removed', 'post_rejected')
     and not exists (
       select 1
       from public.profiles pr
       where pr.id = p_user_id
         and coalesce(pr.notify_moderation_updates, true) = true
     ) then
    return 'skipped';
  end if;

  insert into public.notifications (user_id, type, post_id, message)
  values (
    p_user_id,
    p_type,
    p_post_id,
    nullif(trim(coalesce(p_message, '')), '')
  );
  return 'inserted';
end;
$$;

revoke all on function public.moderation_push_notification (uuid, text, uuid, text) from public;
grant execute on function public.moderation_push_notification (uuid, text, uuid, text) to authenticated;

-- ===== END 021_notification_preferences_and_rpc_hardening.sql =====


-- ===== BEGIN 022_feed_search_performance_indexes_and_rpc_optimization.sql =====

-- Feed/search performance hardening:
-- - add missing expression indexes for lower(...) trigram comparisons
-- - add feed/category indexes
-- - optimize search_published_posts to avoid repeated per-row comment EXISTS checks

create extension if not exists pg_trgm;

-- Feed listing (new sort + cursor paging)
create index if not exists posts_moderation_created_id_idx
  on public.posts (moderation_status, created_at desc, id desc);

-- Category overlap filter (`categories && ...`)
create index if not exists posts_categories_gin_idx
  on public.posts using gin (categories);

-- Trigram search indexes for lower(...) expressions used by RPC
create index if not exists posts_lower_title_trgm_idx
  on public.posts using gin (lower(title) gin_trgm_ops);

create index if not exists posts_lower_description_trgm_idx
  on public.posts using gin (lower(coalesce(description, '')) gin_trgm_ops);

create index if not exists posts_lower_url_trgm_idx
  on public.posts using gin (lower(coalesce(url, '')) gin_trgm_ops);

create index if not exists comments_lower_content_trgm_idx
  on public.comments using gin (lower(content) gin_trgm_ops);

create or replace function public.search_published_posts (
  p_query text,
  p_category_labels text[] default null,
  p_cursor timestamptz default null,
  p_limit int default 20
)
returns table (
  id uuid,
  rank_score double precision
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q text := lower(btrim(coalesce(p_query, '')));
  q_like text := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  lim int := greatest(1, least(coalesce(p_limit, 20), 100));
  trigram_threshold double precision := case when length(q) < 4 then 0.18 else 0.12 end;
begin
  if length(q) < 2 then
    return;
  end if;

  return query
  with base_posts as (
    select
      p.id,
      p.created_at,
      lower(p.title) as title_l,
      lower(coalesce(p.description, '')) as description_l,
      lower(coalesce(p.url, '')) as url_l,
      exists (
        select 1
        from unnest(coalesce(p.categories, '{}'::text[])) as category
        where lower(category) like q_like escape '\'
      ) as category_hit
    from public.posts p
    where p.moderation_status = 'published'
      and (p_cursor is null or p.created_at < p_cursor)
      and (
        p_category_labels is null
        or cardinality(p_category_labels) = 0
        or p.categories && p_category_labels
      )
  ),
  comment_hits as (
    select distinct c.post_id
    from public.comments c
    join base_posts bp on bp.id = c.post_id
    where similarity(lower(c.content), q) > trigram_threshold
       or lower(c.content) like q_like escape '\'
  ),
  ranked as (
    select
      bp.id,
      bp.created_at,
      (
        greatest(
          1.20 * similarity(bp.title_l, q),
          0.90 * similarity(bp.description_l, q),
          0.70 * similarity(bp.url_l, q)
        )
        + case when bp.title_l like q || '%' then 0.35 else 0 end
        + case when bp.title_l like q_like escape '\' then 0.08 else 0 end
        + case when bp.category_hit then 0.10 else 0 end
        + case when ch.post_id is not null then 0.06 else 0 end
      )::double precision as score
    from base_posts bp
    left join comment_hits ch on ch.post_id = bp.id
    where similarity(bp.title_l, q) > trigram_threshold
       or similarity(bp.description_l, q) > trigram_threshold
       or similarity(bp.url_l, q) > trigram_threshold
       or bp.title_l like q_like escape '\'
       or bp.description_l like q_like escape '\'
       or bp.url_l like q_like escape '\'
       or bp.category_hit
       or ch.post_id is not null
  )
  select
    ranked.id,
    ranked.score as rank_score
  from ranked
  order by ranked.score desc, ranked.created_at desc, ranked.id desc
  limit lim;
end;
$$;

revoke all on function public.search_published_posts (text, text[], timestamptz, int) from public;
grant execute on function public.search_published_posts (text, text[], timestamptz, int) to anon, authenticated;

-- ===== END 022_feed_search_performance_indexes_and_rpc_optimization.sql =====


-- ===== BEGIN 023_arena_like_ranking.sql =====

-- Arena-like ranking without UI changes:
-- - keeps existing 1-5 star voting UX
-- - adds robust leaderboard scoring fields to posts
-- - logs rating events for time-window momentum
-- - enforces server-side updated_at + lightweight write throttling

alter table public.posts
  add column if not exists bayes_score double precision not null default 0,
  add column if not exists hot_score double precision not null default 0,
  add column if not exists leaderboard_score double precision not null default 0,
  add column if not exists ratings_last_7d integer not null default 0,
  add column if not exists ratings_last_30d integer not null default 0;

create table if not exists public.rating_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('insert', 'update', 'delete', 'seed')),
  value_before smallint check (value_before is null or (value_before >= 1 and value_before <= 5)),
  value_after smallint check (value_after is null or (value_after >= 1 and value_after <= 5)),
  created_at timestamptz not null default now()
);

create index if not exists rating_events_post_created_idx
  on public.rating_events (post_id, created_at desc);

create index if not exists rating_events_user_created_idx
  on public.rating_events (user_id, created_at desc);

alter table public.rating_events enable row level security;

drop policy if exists "Users read own rating events" on public.rating_events;
create policy "Users read own rating events"
  on public.rating_events
  for select
  using (auth.uid() = user_id);

revoke insert, update, delete on table public.rating_events from anon, authenticated;
grant select on table public.rating_events to authenticated;

create or replace function public.set_rating_updated_at ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tr_ratings_set_updated_at on public.ratings;
create trigger tr_ratings_set_updated_at
  before insert or update on public.ratings
  for each row
  execute function public.set_rating_updated_at ();

create or replace function public.enforce_rating_write_limits ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  writes_last_minute integer;
begin
  if tg_op = 'UPDATE'
     and old.updated_at > now() - interval '3 seconds'
     and old.value is distinct from new.value then
    raise exception 'Too many rating updates, please wait a few seconds.'
      using errcode = '22023';
  end if;

  select count(*)::integer
  into writes_last_minute
  from public.ratings r
  where r.user_id = new.user_id
    and r.updated_at >= now() - interval '1 minute';

  if writes_last_minute >= 40 then
    raise exception 'Rating limit reached, please slow down.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists tr_ratings_enforce_write_limits on public.ratings;
create trigger tr_ratings_enforce_write_limits
  before insert or update on public.ratings
  for each row
  execute function public.enforce_rating_write_limits ();

create or replace function public.log_rating_event ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.rating_events (post_id, user_id, action, value_before, value_after)
    values (new.post_id, new.user_id, 'insert', null, new.value);
    return new;
  elsif tg_op = 'UPDATE' then
    if old.value is distinct from new.value then
      insert into public.rating_events (post_id, user_id, action, value_before, value_after)
      values (new.post_id, new.user_id, 'update', old.value, new.value);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.rating_events (post_id, user_id, action, value_before, value_after)
    values (old.post_id, old.user_id, 'delete', old.value, null);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists tr_ratings_log_event on public.ratings;
create trigger tr_ratings_log_event
  after insert or update or delete on public.ratings
  for each row
  execute function public.log_rating_event ();

create or replace function public.recompute_post_leaderboard_metrics (p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_sum integer;
  recent_7d integer;
  recent_30d integer;
  prior_mean double precision := 3.5;
  prior_weight double precision := 8.0;
  bayes double precision;
  hot double precision;
  final_score double precision;
begin
  select p.rating_sum, p.rating_count
  into v_sum, v_count
  from public.posts p
  where p.id = p_post_id;

  if not found then
    return;
  end if;

  select count(*)::integer
  into recent_7d
  from public.rating_events re
  where re.post_id = p_post_id
    and re.created_at >= now() - interval '7 days';

  select count(*)::integer
  into recent_30d
  from public.rating_events re
  where re.post_id = p_post_id
    and re.created_at >= now() - interval '30 days';

  if v_count > 0 then
    bayes := (v_sum::double precision + (prior_mean * prior_weight))
      / (v_count::double precision + prior_weight);
  else
    bayes := prior_mean;
  end if;

  hot := bayes
    + (ln(1 + greatest(recent_7d, 0)) * 0.18)
    + (ln(1 + greatest(recent_30d, 0)) * 0.08);

  final_score := hot + (least(greatest(v_count, 0), 1000)::double precision * 0.0015);

  update public.posts
  set
    bayes_score = bayes,
    hot_score = hot,
    leaderboard_score = final_score,
    ratings_last_7d = recent_7d,
    ratings_last_30d = recent_30d
  where id = p_post_id;
end;
$$;

create or replace function public.refresh_post_leaderboard_from_rating ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_post_id uuid;
begin
  if tg_op = 'DELETE' then
    affected_post_id := old.post_id;
  else
    affected_post_id := new.post_id;
  end if;

  perform public.recompute_post_leaderboard_metrics(affected_post_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists tr_ratings_refresh_post_leaderboard on public.ratings;
create trigger tr_ratings_refresh_post_leaderboard
  after insert or update or delete on public.ratings
  for each row
  execute function public.refresh_post_leaderboard_from_rating ();

insert into public.rating_events (post_id, user_id, action, value_before, value_after, created_at)
select r.post_id, r.user_id, 'seed', null, r.value, coalesce(r.updated_at, r.created_at, now())
from public.ratings r
where not exists (
  select 1
  from public.rating_events re
  where re.action = 'seed'
    and re.post_id = r.post_id
    and re.user_id = r.user_id
);

do $$
declare
  p record;
begin
  for p in select id from public.posts loop
    perform public.recompute_post_leaderboard_metrics(p.id);
  end loop;
end;
$$;

create index if not exists posts_moderation_leaderboard_idx
  on public.posts (moderation_status, leaderboard_score desc, created_at desc, id desc);

create index if not exists posts_leaderboard_idx
  on public.posts (leaderboard_score desc, created_at desc, id desc);

-- ===== END 023_arena_like_ranking.sql =====


-- ===== BEGIN 024_agent_engine_split_and_catalog_seed.sql =====

-- Distinguish AI Engines vs AI Agents and enforce category compatibility.

alter table public.posts
  add column if not exists post_kind text;

update public.posts
set post_kind = case
  when coalesce(categories[1], '') in (
    'Automation',
    'Marketing',
    'Coding Agent',
    'Research Agent',
    'Writing Agent',
    'Data Analysis Agent',
    'Customer Support Agent',
    'Sales Agent',
    'Marketing Agent',
    'Automation Agent',
    'DevOps Agent',
    'Multi-Agent Platform'
  ) then 'AI Agent'
  else 'AI Engine'
end
where post_kind is null;

alter table public.posts
  alter column post_kind set default 'AI Engine',
  alter column post_kind set not null;

alter table public.posts
  drop constraint if exists posts_post_kind_check;

alter table public.posts
  add constraint posts_post_kind_check check (post_kind in ('AI Engine', 'AI Agent'));

create or replace function public.validate_post_kind_categories ()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  allowed text[];
begin
  if new.post_kind = 'AI Agent' then
    allowed := array[
      'Coding Agent',
      'Research Agent',
      'Writing Agent',
      'Data Analysis Agent',
      'Customer Support Agent',
      'Sales Agent',
      'Marketing Agent',
      'Automation Agent',
      'DevOps Agent',
      'Multi-Agent Platform'
    ];
  else
    allowed := array[
      'General LLM',
      'Reasoning Model',
      'Coding Model',
      'Image Generation Model',
      'Video Generation Model',
      'Speech / Audio Model',
      'Embedding Model',
      'Reranker Model',
      'Multimodal Model',
      'Open-Source Model'
    ];
  end if;

  if coalesce(array_length(new.categories, 1), 0) < 1 then
    raise exception 'At least one category is required.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(new.categories) c
    where not (c = any (allowed))
  ) then
    raise exception 'Category does not match post kind.' using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists tr_posts_validate_post_kind_categories on public.posts;
create trigger tr_posts_validate_post_kind_categories
  before insert or update on public.posts
  for each row
  execute function public.validate_post_kind_categories ();

-- Map legacy broad categories to the new split taxonomy.
update public.posts
set categories = array[
  case
    when coalesce(categories[1], '') = 'AI Tools' then 'General LLM'
    when coalesce(categories[1], '') = 'Automation' and post_kind = 'AI Agent' then 'Automation Agent'
    when coalesce(categories[1], '') = 'Automation' then 'General LLM'
    when coalesce(categories[1], '') = 'Marketing' and post_kind = 'AI Agent' then 'Marketing Agent'
    when coalesce(categories[1], '') = 'Marketing' then 'General LLM'
    when coalesce(categories[1], '') = 'Coding' and post_kind = 'AI Agent' then 'Coding Agent'
    when coalesce(categories[1], '') = 'Coding' then 'Coding Model'
    else coalesce(categories[1], 'General LLM')
  end
];

-- Seed a starter catalog of known engines and agents using the earliest admin account.
with owner as (
  select pr.id
  from public.profiles pr
  where pr.is_admin = true
  order by pr.created_at asc
  limit 1
),
seed_rows(title, url, description, post_kind, category) as (
  values
    ('OpenAI GPT-4o', 'https://openai.com/index/hello-gpt-4o/', 'OpenAI multimodal flagship model family.', 'AI Engine', 'Multimodal Model'),
    ('OpenAI o3', 'https://openai.com/index/introducing-o3-and-o4-mini/', 'OpenAI reasoning-focused model line.', 'AI Engine', 'Reasoning Model'),
    ('Anthropic Claude 3.7 Sonnet', 'https://www.anthropic.com/claude', 'General-purpose Claude model line for chat, coding, and analysis.', 'AI Engine', 'General LLM'),
    ('Google Gemini 2.5 Pro', 'https://ai.google.dev/', 'Google Gemini model family for reasoning and multimodal workloads.', 'AI Engine', 'Multimodal Model'),
    ('xAI Grok 3', 'https://x.ai/', 'xAI frontier model family.', 'AI Engine', 'General LLM'),
    ('Meta Llama 4', 'https://ai.meta.com/llama/', 'Meta open model family for text and multimodal tasks.', 'AI Engine', 'Open-Source Model'),
    ('Mistral Large', 'https://mistral.ai/', 'Mistral flagship large language model line.', 'AI Engine', 'General LLM'),
    ('DeepSeek V3', 'https://www.deepseek.com/', 'DeepSeek general model family.', 'AI Engine', 'General LLM'),
    ('Cohere Command R+', 'https://cohere.com/', 'Cohere enterprise command model line.', 'AI Engine', 'General LLM'),
    ('Qwen 2.5', 'https://qwenlm.github.io/', 'Alibaba Qwen model family.', 'AI Engine', 'Open-Source Model'),
    ('AI21 Jamba', 'https://www.ai21.com/', 'AI21 hybrid architecture model line.', 'AI Engine', 'General LLM'),
    ('Stability SDXL', 'https://stability.ai/', 'Image generation model family from Stability AI.', 'AI Engine', 'Image Generation Model'),
    ('Midjourney Model', 'https://www.midjourney.com/', 'Production image generation model family.', 'AI Engine', 'Image Generation Model'),
    ('ElevenLabs Speech', 'https://elevenlabs.io/', 'Speech generation and voice models.', 'AI Engine', 'Speech / Audio Model'),
    ('OpenAI text-embedding-3-large', 'https://platform.openai.com/docs/guides/embeddings', 'Embedding model for semantic search and retrieval.', 'AI Engine', 'Embedding Model'),
    ('Voyage Embeddings', 'https://www.voyageai.com/', 'Embedding and reranker model family.', 'AI Engine', 'Embedding Model'),
    ('Cohere Rerank', 'https://cohere.com/rerank', 'Neural reranking model family.', 'AI Engine', 'Reranker Model'),
    ('Runway Gen-3', 'https://runwayml.com/', 'Video generation model family.', 'AI Engine', 'Video Generation Model'),
    ('Pika Video Model', 'https://pika.art/', 'Video generation model family.', 'AI Engine', 'Video Generation Model'),
    ('Whisper', 'https://openai.com/research/whisper', 'Open-source speech-to-text model family.', 'AI Engine', 'Speech / Audio Model'),
    ('OpenAI Operator', 'https://openai.com/index/introducing-operator/', 'Autonomous task agent for browser and workflow tasks.', 'AI Agent', 'Automation Agent'),
    ('Anthropic Claude Code', 'https://www.anthropic.com/claude-code', 'Coding-focused AI agent in terminal/editor workflows.', 'AI Agent', 'Coding Agent'),
    ('Devin', 'https://www.cognition.ai/', 'Software engineering agent from Cognition.', 'AI Agent', 'Coding Agent'),
    ('Cursor Agent', 'https://www.cursor.com/', 'IDE-native coding and refactoring agent.', 'AI Agent', 'Coding Agent'),
    ('GitHub Copilot Agent Mode', 'https://github.com/features/copilot', 'Copilot autonomous coding and issue-resolution flows.', 'AI Agent', 'Coding Agent'),
    ('OpenHands', 'https://github.com/All-Hands-AI/OpenHands', 'Open-source software engineering agent.', 'AI Agent', 'Coding Agent'),
    ('AutoGen', 'https://github.com/microsoft/autogen', 'Framework for orchestrating multiple collaborative agents.', 'AI Agent', 'Multi-Agent Platform'),
    ('CrewAI', 'https://www.crewai.com/', 'Agent orchestration framework for role-based task execution.', 'AI Agent', 'Multi-Agent Platform'),
    ('LangGraph Agents', 'https://www.langchain.com/langgraph', 'Stateful graph-based multi-agent orchestration.', 'AI Agent', 'Multi-Agent Platform'),
    ('Perplexity Deep Research', 'https://www.perplexity.ai/', 'Web-grounded research agent workflow.', 'AI Agent', 'Research Agent'),
    ('Genspark AI Agent', 'https://www.genspark.ai/', 'General-purpose research and synthesis agent.', 'AI Agent', 'Research Agent'),
    ('Harvey AI', 'https://www.harvey.ai/', 'Domain-specific legal workflow agent.', 'AI Agent', 'Writing Agent'),
    ('Jasper Marketing Agent', 'https://www.jasper.ai/', 'Marketing strategy and content automation agent.', 'AI Agent', 'Marketing Agent'),
    ('Intercom Fin', 'https://www.intercom.com/fin', 'Customer support automation agent.', 'AI Agent', 'Customer Support Agent'),
    ('Ada Support Agent', 'https://www.ada.cx/', 'Automated customer support agent platform.', 'AI Agent', 'Customer Support Agent'),
    ('Salesforce Agentforce', 'https://www.salesforce.com/agentforce/', 'Enterprise sales and support agent platform.', 'AI Agent', 'Sales Agent'),
    ('Clay Agent Workflows', 'https://www.clay.com/', 'Outbound prospecting and sales automation agents.', 'AI Agent', 'Sales Agent'),
    ('Zapier AI Agents', 'https://zapier.com/ai', 'Automation agents that execute app workflows.', 'AI Agent', 'Automation Agent'),
    ('n8n AI Agent', 'https://n8n.io/', 'Workflow automation agent in no-code pipelines.', 'AI Agent', 'Automation Agent'),
    ('Replit Agent', 'https://replit.com/', 'Build-and-deploy coding agent in cloud IDE workflows.', 'AI Agent', 'DevOps Agent'),
    ('AWS Q Developer Agent', 'https://aws.amazon.com/q/developer/', 'Developer and cloud operations assistant agent.', 'AI Agent', 'DevOps Agent')
),
normalized as (
  select
    o.id as user_id,
    s.title,
    s.url,
    s.url as url_canonical,
    s.description,
    s.post_kind,
    s.category
  from owner o
  cross join seed_rows s
)
insert into public.posts (user_id, title, url, url_canonical, description, categories, post_kind)
select
  n.user_id,
  n.title,
  n.url,
  n.url_canonical,
  n.description,
  array[n.category]::text[],
  n.post_kind
from normalized n
where not exists (
  select 1
  from public.posts p
  where lower(p.title) = lower(n.title)
     or (p.url_canonical is not null and p.url_canonical = n.url_canonical)
);

-- ===== END 024_agent_engine_split_and_catalog_seed.sql =====
