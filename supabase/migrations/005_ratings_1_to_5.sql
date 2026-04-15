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
