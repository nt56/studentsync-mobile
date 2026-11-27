-- colleges: public columns for everyone, no direct writes.
begin;
\ir ../helpers.psql
select no_plan();

select tests.create_user('alice@test.local', '{"first_name": "Alice"}') as alice \gset
select tests.create_user_with_role('root@test.local', 'admin') as admin \gset
insert into public.colleges (id, name, location, status, submitted_by, decision_reason)
values ('30000000-0000-4000-8000-000000000001', 'Test College', 'Pune', 'rejected', :'alice', 'Duplicate entry');

select tests.act_as_anon();
select results_eq(
  $$select name::text, location, status::text from public.colleges where id = '30000000-0000-4000-8000-000000000001'$$,
  $$values ('Test College', 'Pune', 'rejected')$$,
  'anon reads the public columns');
select is(tests.error_state('select submitted_by from public.colleges'), '42501',
  'anon cannot read who submitted a college');
select is(tests.error_state('select * from public.colleges'), '42501',
  'select * is refused, because it includes private columns');
select is(tests.error_state($$insert into public.colleges (name) values ('Sneaky College')$$), '42501',
  'anon cannot add colleges');
reset role;

select tests.authenticate_as(:'alice');
select isnt_empty('select id, name from public.colleges', 'a signed-in user reads colleges');
select is(tests.error_state('select decision_reason from public.colleges'), '42501',
  'a signed-in user cannot read the decision reason');
select is(tests.error_state($$insert into public.colleges (name) values ('Sneaky College')$$), '42501',
  'a user cannot add colleges directly');
select is(tests.error_state($$update public.colleges set status = 'verified'$$), '42501',
  'a user cannot verify colleges');
select is(tests.error_state('delete from public.colleges'), '42501',
  'a user cannot delete colleges');
reset role;

select tests.authenticate_as(:'admin');
select is(tests.error_state($$update public.colleges set status = 'verified'$$), '42501',
  'even an admin changes colleges only through functions (Phase 9)');
reset role;

select throws_ok($$insert into public.colleges (name) values ('TEST COLLEGE')$$, '23505', null,
  'names that differ only in case are duplicates');
select throws_ok($$insert into public.colleges (name) values ('AB')$$, '23514', null,
  'a name shorter than 3 characters is refused');
select throws_ok($$insert into public.colleges (name) values (' Padded ')$$, '23514', null,
  'a name with surrounding spaces is refused');

select * from finish();
rollback;
