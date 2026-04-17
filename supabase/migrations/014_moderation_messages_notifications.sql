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
