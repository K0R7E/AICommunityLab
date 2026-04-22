-- Allow users to delete (dismiss) their own notifications from the inbox.

drop policy if exists "Users delete own notifications" on public.notifications;

create policy "Users delete own notifications"
  on public.notifications
  for delete
  using (auth.uid() = user_id);

grant delete on table public.notifications to authenticated;
