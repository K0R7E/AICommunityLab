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
