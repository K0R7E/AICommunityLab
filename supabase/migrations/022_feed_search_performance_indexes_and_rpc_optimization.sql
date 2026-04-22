-- Feed/search performance hardening:
-- - add missing expression indexes for lower(...) trigram comparisons
-- - add feed/category indexes
-- - optimize search_published_posts to avoid repeated per-row comment EXISTS checks

create extension if not exists pg_trgm;

-- Feed listing (new sort + cursor paging)
create index if not exists posts_moderation_created_id_idx
  on public.posts (moderation_status, created_at desc, id desc);

-- Category overlap filter (`categories && ...`)
create index if not exists posts_categories_gin_idx
  on public.posts using gin (categories);

-- Trigram search indexes for lower(...) expressions used by RPC
create index if not exists posts_lower_title_trgm_idx
  on public.posts using gin (lower(title) gin_trgm_ops);

create index if not exists posts_lower_description_trgm_idx
  on public.posts using gin (lower(coalesce(description, '')) gin_trgm_ops);

create index if not exists posts_lower_url_trgm_idx
  on public.posts using gin (lower(coalesce(url, '')) gin_trgm_ops);

create index if not exists comments_lower_content_trgm_idx
  on public.comments using gin (lower(content) gin_trgm_ops);

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
  with base_posts as (
    select
      p.id,
      p.created_at,
      lower(p.title) as title_l,
      lower(coalesce(p.description, '')) as description_l,
      lower(coalesce(p.url, '')) as url_l,
      exists (
        select 1
        from unnest(coalesce(p.categories, '{}'::text[])) as category
        where lower(category) like q_like escape '\'
      ) as category_hit
    from public.posts p
    where p.moderation_status = 'published'
      and (p_cursor is null or p.created_at < p_cursor)
      and (
        p_category_labels is null
        or cardinality(p_category_labels) = 0
        or p.categories && p_category_labels
      )
  ),
  comment_hits as (
    select distinct c.post_id
    from public.comments c
    join base_posts bp on bp.id = c.post_id
    where similarity(lower(c.content), q) > trigram_threshold
       or lower(c.content) like q_like escape '\'
  ),
  ranked as (
    select
      bp.id,
      bp.created_at,
      (
        greatest(
          1.20 * similarity(bp.title_l, q),
          0.90 * similarity(bp.description_l, q),
          0.70 * similarity(bp.url_l, q)
        )
        + case when bp.title_l like q || '%' then 0.35 else 0 end
        + case when bp.title_l like q_like escape '\' then 0.08 else 0 end
        + case when bp.category_hit then 0.10 else 0 end
        + case when ch.post_id is not null then 0.06 else 0 end
      )::double precision as score
    from base_posts bp
    left join comment_hits ch on ch.post_id = bp.id
    where similarity(bp.title_l, q) > trigram_threshold
       or similarity(bp.description_l, q) > trigram_threshold
       or similarity(bp.url_l, q) > trigram_threshold
       or bp.title_l like q_like escape '\'
       or bp.description_l like q_like escape '\'
       or bp.url_l like q_like escape '\'
       or bp.category_hit
       or ch.post_id is not null
  )
  select
    ranked.id,
    ranked.score as rank_score
  from ranked
  order by ranked.score desc, ranked.created_at desc, ranked.id desc
  limit lim;
end;
$$;

revoke all on function public.search_published_posts (text, text[], timestamptz, int) from public;
grant execute on function public.search_published_posts (text, text[], timestamptz, int) to anon, authenticated;
