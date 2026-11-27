-- Rules that must hold for the whole schema, not one table. They keep passing
-- as later phases add tables and functions, so a forgotten RLS switch or
-- REVOKE fails CI instead of reaching staging.
begin;
\ir ../helpers.psql
select no_plan();

select is_empty(
  $$ select c.relname
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity $$,
  'every table in public has row-level security enabled'
);

select is_empty(
  $$ select n.nspname || '.' || p.proname
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public', 'private')
       and p.prosecdef
       and not coalesce(p.proconfig @> array['search_path=""'], false) $$,
  'every security definer function sets an empty search_path'
);

select is_empty(
  $$ select p.proname
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private'
       and (has_function_privilege('anon', p.oid, 'execute')
            or has_function_privilege('authenticated', p.oid, 'execute'))
       and p.proname not in ('caller_role', 'is_active_user', 'is_admin', 'raise_error') $$,
  'API roles can execute only the policy helpers in private'
);

select is_empty(
  $$ select p.proname
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private'
       and p.proname in ('caller_role', 'is_active_user', 'is_admin')
       and has_function_privilege('anon', p.oid, 'execute') $$,
  'anon cannot execute the caller helpers'
);

select is_empty(
  $$ select p.proname
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and (has_function_privilege('anon', p.oid, 'execute')
            or has_function_privilege('authenticated', p.oid, 'execute')) $$,
  'no public function is executable by API roles yet (Phase 0 has none)'
);

select is_empty(
  $$ select c.relname
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
       and has_table_privilege('anon', c.oid, 'select, insert, update, delete, truncate') $$,
  'anon has no table-level privilege on any public table'
);

select is_empty(
  $$ select c.relname
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p')
       and has_table_privilege('authenticated', c.oid, 'insert, delete, truncate') $$,
  'authenticated cannot insert, delete or truncate any public table directly'
);

select ok(
  not has_schema_privilege('anon', 'private', 'create')
  and not has_schema_privilege('authenticated', 'private', 'create'),
  'API roles cannot create objects in private'
);

select * from finish();
rollback;
