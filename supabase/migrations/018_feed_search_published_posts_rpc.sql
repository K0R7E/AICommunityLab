-- Feed search: fuzzy matching via pg_trgm over published posts.

create extension if not exists pg_trgm;

create index if not exists posts_url_trgm
  on public.posts using gin (url gin_trgm_ops)
  where url is not null and btrim(url) <> '';

create index if not exists comments_content_trgm
  on public.comments using gin (content gin_trgm_ops);

create or replace function public.search_published_posts (
  p_query text,
  p_category_labels text[] default null,
  p_cursor timestamptz default null,
  p_limit int default 20
)
returns table (
  id uuid,
  rank_score double precision
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q text := lower(btrim(coalesce(p_query, '')));
  q_like text := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  lim int := greatest(1, least(coalesce(p_limit, 20), 100));
  trigram_threshold double precision := case when length(q) < 4 then 0.18 else 0.12 end;
begin
  if length(q) < 2 then
    return;
  end if;

  return query
  with candidates as (
    select
      p.id,
      p.created_at,
      (
        greatest(
          1.20 * similarity(lower(p.title), q),
          0.90 * similarity(lower(coalesce(p.description, '')), q),
          0.70 * similarity(lower(coalesce(p.url, '')), q)
        )
        + case when lower(p.title) like q || '%' then 0.35 else 0 end
        + case when lower(p.title) like q_like escape '\' then 0.08 else 0 end
        + case
            when exists (
              select 1
              from unnest(coalesce(p.categories, '{}'::text[])) as category
              where lower(category) like q_like escape '\'
            ) then 0.10
            else 0
          end
        + case
            when exists (
              select 1
              from public.comments c
              where c.post_id = p.id
                and (
                  similarity(lower(c.content), q) > trigram_threshold
                  or lower(c.content) like q_like escape '\'
                )
            ) then 0.06
            else 0
          end
      )::double precision as score
    from public.posts p
    where p.moderation_status = 'published'
      and (p_cursor is null or p.created_at < p_cursor)
      and (
        p_category_labels is null
        or cardinality(p_category_labels) = 0
        or p.categories && p_category_labels
      )
      and (
        similarity(lower(p.title), q) > trigram_threshold
        or similarity(lower(coalesce(p.description, '')), q) > trigram_threshold
        or similarity(lower(coalesce(p.url, '')), q) > trigram_threshold
        or lower(p.title) like q_like escape '\'
        or lower(coalesce(p.description, '')) like q_like escape '\'
        or lower(coalesce(p.url, '')) like q_like escape '\'
        or exists (
          select 1
          from unnest(coalesce(p.categories, '{}'::text[])) as category
          where lower(category) like q_like escape '\'
        )
        or exists (
          select 1
          from public.comments c
          where c.post_id = p.id
            and (
              similarity(lower(c.content), q) > trigram_threshold
              or lower(c.content) like q_like escape '\'
            )
        )
      )
  )
  select
    candidates.id,
    candidates.score as rank_score
  from candidates
  order by candidates.score desc, candidates.created_at desc, candidates.id desc
  limit lim;
end;
$$;

revoke all on function public.search_published_posts (text, text[], timestamptz, int) from public;
grant execute on function public.search_published_posts (text, text[], timestamptz, int) to anon, authenticated;
