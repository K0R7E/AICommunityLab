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
