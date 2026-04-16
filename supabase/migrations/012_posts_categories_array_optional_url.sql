-- Multiple categories per post (text[]) and optional tool URL.

alter table public.posts add column if not exists categories text[];

update public.posts
set categories = array[category]::text[]
where categories is null;

alter table public.posts alter column categories set not null;

alter table public.posts
  add constraint posts_categories_nonempty
  check (coalesce(array_length(categories, 1), 0) >= 1);

alter table public.posts drop column category;

alter table public.posts alter column url drop not null;

update public.posts
set url = null
where url is not null and btrim(url) = '';

create index if not exists posts_categories_gin on public.posts using gin (categories);
