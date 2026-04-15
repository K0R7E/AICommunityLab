-- Teljes törlés: 001 + 002 által létrehozott objektumok (FIGYELEM: minden post/komment/szavazat/profil adat elvész a public táblákból).
-- Futtasd a Supabase SQL Editorban, majd sorrendben futtasd újra: 001_initial.sql, 002_profiles_and_rls.sql.
-- Meglévő auth felhasználók profilja NEM jön létre automatikusan — utána futtasd a 003_backfill_profiles.sql fájlt is.

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.ratings cascade;
drop table if exists public.votes cascade;
drop table if exists public.comments cascade;
drop table if exists public.posts cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.increment_post_votes_count() cascade;
drop function if exists public.decrement_post_votes_count() cascade;
drop function if exists public.increment_post_comments_count() cascade;
drop function if exists public.decrement_post_comments_count() cascade;
drop function if exists public.apply_rating_to_post() cascade;
