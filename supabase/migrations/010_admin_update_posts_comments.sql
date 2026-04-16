-- Admins may edit any post or comment (moderation)

create policy "Admins update any post"
  on public.posts
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Admins update any comment"
  on public.comments
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
