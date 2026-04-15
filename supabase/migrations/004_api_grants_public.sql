-- PostgREST / Supabase JS kliens a `anon` és `authenticated` szerepkörökkel éri el a táblákat.
-- Ha a táblák SQL Editorból készültek és hiányoznak a grantek, 403-at kapsz: "permission denied for schema public".

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;

-- Később létrehozott táblákra is (ha a migrációt a postgres szerepkör futtatja)
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
