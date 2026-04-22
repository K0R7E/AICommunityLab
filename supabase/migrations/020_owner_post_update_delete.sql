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
