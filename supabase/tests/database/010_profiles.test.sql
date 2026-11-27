-- profiles: who can read and change which rows and columns.
begin;
\ir ../helpers.psql
select no_plan();

-- Fixtures, created as the owner.
select tests.create_user('alice@test.local', '{"first_name": "Alice", "last_name": "A"}') as alice \gset
select tests.create_user('bob@test.local', '{"first_name": "Bob"}') as bob \gset
select tests.create_user_with_role('root@test.local', 'admin') as admin \gset
select tests.create_user('gone@test.local', '{"first_name": "Gone"}') as gone \gset
update public.profiles set deleted_at = now() where id = :'gone';
insert into public.colleges (id, name, status)
values ('30000000-0000-4000-8000-000000000001', 'Open College', 'verified'),
       ('30000000-0000-4000-8000-000000000002', 'Closed College', 'rejected');

-- Signed out ------------------------------------------------------------------
select tests.act_as_anon();
select is(tests.error_state('select id from public.profiles'), '42501',
  'anon cannot read profiles at all (no grant)');
reset role;

-- A student -------------------------------------------------------------------
select tests.authenticate_as(:'alice');

select results_eq('select id from public.profiles', array[:'alice'::uuid],
  'a user sees only their own profile');

select is(
  tests.rows_changed(format($$update public.profiles set first_name = 'Alicia' where id = %L$$, :'alice')),
  1::bigint, 'a user can rename themselves');
select is((select first_name from public.profiles where id = :'alice'), 'Alicia', 'the new name is saved');

select is(
  tests.rows_changed(format($$update public.profiles set first_name = '  Al  ' where id = %L$$, :'alice')),
  1::bigint, 'names with spaces are accepted');
select is((select first_name from public.profiles where id = :'alice'), 'Al', 'and trimmed');

select is(
  tests.error_code(format($$update public.profiles set first_name = '   ' where id = %L$$, :'alice')),
  'VALIDATION', 'an empty first name is refused');

select is(
  tests.rows_changed(format($$update public.profiles set college_id = '30000000-0000-4000-8000-000000000001' where id = %L$$, :'alice')),
  1::bigint, 'a user can pick a verified college');

select is(
  tests.error_code(format($$update public.profiles set college_id = '30000000-0000-4000-8000-000000000002' where id = %L$$, :'alice')),
  'VALIDATION', 'a rejected college is refused');

select is(
  tests.error_state(format($$update public.profiles set role = 'admin' where id = %L$$, :'alice')),
  '42501', 'a user cannot change their own role');
select is(
  tests.error_state(format($$update public.profiles set deleted_at = null where id = %L$$, :'alice')),
  '42501', 'a user cannot change deleted_at');
select is(
  tests.error_state(format($$update public.profiles set id = gen_random_uuid() where id = %L$$, :'alice')),
  '42501', 'a user cannot change their id');

select is(
  tests.rows_changed(format($$update public.profiles set first_name = 'Hacked' where id = %L$$, :'bob')),
  0::bigint, 'a user cannot update someone else''s profile');

select is(
  tests.error_state($$insert into public.profiles (id, first_name) values (gen_random_uuid(), 'X')$$),
  '42501', 'a user cannot insert profiles');
select is(
  tests.error_state(format($$delete from public.profiles where id = %L$$, :'alice')),
  '42501', 'a user cannot delete profiles');
reset role;

select is((select first_name from public.profiles where id = :'bob'), 'Bob', 'bob''s name is unchanged');
select is((select role from public.profiles where id = :'alice'), 'student'::public.user_role, 'alice is still a student');

-- A deleted account -----------------------------------------------------------
select tests.authenticate_as(:'gone');
select is_empty('select id from public.profiles', 'a deleted user cannot read their profile');
select is(
  tests.rows_changed(format($$update public.profiles set first_name = 'Back' where id = %L$$, :'gone')),
  0::bigint, 'a deleted user cannot update their profile');
reset role;

-- An admin --------------------------------------------------------------------
select tests.authenticate_as(:'admin');
select is((select count(*) from public.profiles where id in (:'alice', :'bob', :'admin', :'gone')),
  4::bigint, 'an admin reads every profile');
select is(
  tests.rows_changed(format($$update public.profiles set first_name = 'X' where id = %L$$, :'bob')),
  0::bigint, 'an admin cannot edit another profile directly (functions only)');
reset role;

-- An admin who was deleted loses admin rights at once.
update public.profiles set deleted_at = now() where id = :'admin';
select tests.authenticate_as(:'admin');
select is_empty('select id from public.profiles', 'a deleted admin reads nothing');
reset role;

select * from finish();
rollback;
