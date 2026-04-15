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
