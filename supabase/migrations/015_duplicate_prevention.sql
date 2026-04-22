-- Duplicate prevention: canonical URL uniqueness + pg_trgm similarity RPC for no-URL submits.

create extension if not exists pg_trgm;

alter table public.posts
  add column if not exists url_canonical text;

comment on column public.posts.url_canonical is
  'Normalized https URL for dedup; set by application on write.';

create unique index if not exists posts_url_canonical_unique_pending_published
  on public.posts (url_canonical)
  where
    url_canonical is not null
    and moderation_status in ('pending', 'published');

create index if not exists posts_title_trgm
  on public.posts using gin (title gin_trgm_ops);

create index if not exists posts_description_trgm
  on public.posts using gin (description gin_trgm_ops)
  where description is not null and btrim(description) <> '';

-- Similar listings for submit flow (pending + published only; excludes rejected).
create or replace function public.find_similar_posts_for_submit (
  p_title text,
  p_description text,
  p_max_results int default 8
)
returns table (
  id uuid,
  title text,
  excerpt text,
  moderation_status text,
  score double precision
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  t text := lower(btrim(coalesce(p_title, '')));
  d text := lower(btrim(coalesce(p_description, '')));
  lim int := greatest(1, least(coalesce(p_max_results, 8), 24));
begin
  if length(t) < 3 then
    return;
  end if;

  return query
  select
    p.id,
    p.title,
    left(coalesce(p.description, ''), 240) as excerpt,
    p.moderation_status,
    (
      case
        when length(d) < 5 then
          similarity(lower(btrim(p.title)), t)::double precision
        else greatest(
          0.62 * similarity(lower(btrim(p.title)), t) + 0.38 * similarity(
            lower(btrim(coalesce(p.description, ''))),
            d
          ),
          similarity(lower(btrim(p.title)), t)::double precision
        )
      end
    ) as score
  from public.posts p
  where p.moderation_status in ('pending', 'published')
    and (
      similarity(lower(btrim(p.title)), t) > 0.12
      or (
        length(d) >= 5
        and similarity(lower(btrim(coalesce(p.description, ''))), d) > 0.12
      )
    )
  order by score desc
  limit lim;
end;
$$;

revoke all on function public.find_similar_posts_for_submit (text, text, int) from public;
grant execute on function public.find_similar_posts_for_submit (text, text, int) to authenticated;
