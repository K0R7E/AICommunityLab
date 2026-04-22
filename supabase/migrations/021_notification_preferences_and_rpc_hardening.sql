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
