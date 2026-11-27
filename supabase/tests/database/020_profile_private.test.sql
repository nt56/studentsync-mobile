-- profile_private: personal details for the owner and admins only.
begin;
\ir ../helpers.psql
select no_plan();

select tests.create_user('alice@test.local', '{"first_name": "Alice"}') as alice \gset
select tests.create_user('bob@test.local', '{"first_name": "Bob"}') as bob \gset
select tests.create_user_with_role('root@test.local', 'admin') as admin \gset

select tests.act_as_anon();
select is(tests.error_state('select email from public.profile_private'), '42501',
  'anon cannot read private profiles');
reset role;

select tests.authenticate_as(:'alice');
select results_eq('select email::text from public.profile_private', array['alice@test.local'],
  'a user reads only their own private profile');

select is(
  tests.rows_changed(format($$update public.profile_private
    set phone = '+91 98765-43210', gender = 'female', date_of_birth = '2000-01-15', bio = 'Hi'
    where profile_id = %L$$, :'alice')),
  1::bigint, 'a user updates phone, gender, birth date and bio');

select is(
  tests.error_code(format($$update public.profile_private set phone = '12345' where profile_id = %L$$, :'alice')),
  'VALIDATION', 'a phone with fewer than 10 digits is refused');
select is(
  tests.error_code(format($$update public.profile_private set phone = '1234567890123456' where profile_id = %L$$, :'alice')),
  'VALIDATION', 'a phone with more than 15 digits is refused');
select is(
  tests.error_code(format($$update public.profile_private set phone = 'call me' where profile_id = %L$$, :'alice')),
  'VALIDATION', 'a phone with letters is refused');
select is(
  tests.error_code(format($$update public.profile_private set date_of_birth = current_date - interval '15 years' where profile_id = %L$$, :'alice')),
  'VALIDATION', 'someone under 16 is refused');
select is(
  tests.error_code(format($$update public.profile_private set bio = repeat('x', 501) where profile_id = %L$$, :'alice')),
  'VALIDATION', 'a bio over 500 characters is refused');

select is(
  tests.error_state(format($$update public.profile_private set email = 'new@test.local' where profile_id = %L$$, :'alice')),
  '42501', 'email cannot be changed here (it follows Auth)');
select is(
  tests.error_state(format($$update public.profile_private set deletion_requested_at = now() where profile_id = %L$$, :'alice')),
  '42501', 'deletion_requested_at cannot be set directly');

select is(
  tests.rows_changed(format($$update public.profile_private set bio = 'mine now' where profile_id = %L$$, :'bob')),
  0::bigint, 'a user cannot update someone else''s private profile');
reset role;

select tests.authenticate_as(:'admin');
select is((select count(*) from public.profile_private where profile_id in (:'alice', :'bob')),
  2::bigint, 'an admin reads private profiles');
reset role;

select tests.authenticate_as(:'bob');
select is_empty(format('select 1 from public.profile_private where profile_id = %L', :'alice'),
  'another user cannot read alice''s private profile');
reset role;

select * from finish();
rollback;
