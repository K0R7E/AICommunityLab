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
