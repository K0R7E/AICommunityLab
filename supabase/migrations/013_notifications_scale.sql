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
