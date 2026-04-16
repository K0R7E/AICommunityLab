-- Defense in depth: unauthenticated clients should not hold INSERT/UPDATE/DELETE
-- on app tables; RLS already restricts data, but this limits damage from new tables
-- that might ship without policies. Triggers and SECURITY DEFINER routines are
-- unaffected. SELECT remains for public read paths using the anon key.

revoke insert, update, delete on table public.posts from anon;
revoke insert, update, delete on table public.comments from anon;
revoke insert, update, delete on table public.profiles from anon;
revoke insert, update, delete on table public.ratings from anon;
