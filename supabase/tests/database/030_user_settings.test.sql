-- user_settings: only the owner reads and updates.
begin;
\ir ../helpers.psql
select no_plan();

select tests.create_user('alice@test.local', '{"first_name": "Alice"}') as alice \gset
select tests.create_user('bob@test.local', '{"first_name": "Bob"}') as bob \gset
select tests.create_user_with_role('root@test.local', 'admin') as admin \gset

select tests.act_as_anon();
select is(tests.error_state('select 1 from public.user_settings'), '42501',
  'anon cannot read settings');
reset role;

select tests.authenticate_as(:'alice');
select results_eq(
  'select reminders_enabled, email_enabled, push_enabled from public.user_settings',
  $$values (true, true, true)$$,
  'a new user has every preference switched on, and sees only their own row');

select is(
  tests.rows_changed(format($$update public.user_settings
    set push_enabled = false, interests = '{technical,sports,technical}'
    where profile_id = %L$$, :'alice')),
  1::bigint, 'a user updates their settings');
select is((select interests from public.user_settings where profile_id = :'alice'),
  '{technical,sports}'::public.event_category[], 'duplicate interests are removed');

select is(
  tests.rows_changed(format($$update public.user_settings set push_enabled = false where profile_id = %L$$, :'bob')),
  0::bigint, 'a user cannot update someone else''s settings');
select is(
  tests.error_state(format($$update public.user_settings set profile_id = %L where profile_id = %L$$, :'bob', :'alice')),
  '42501', 'profile_id cannot be changed');
select is(
  tests.error_state(format($$delete from public.user_settings where profile_id = %L$$, :'alice')),
  '42501', 'settings cannot be deleted directly');
reset role;

select tests.authenticate_as(:'admin');
select is_empty(format('select 1 from public.user_settings where profile_id = %L', :'alice'),
  'admins do not read other people''s settings');
reset role;

select * from finish();
rollback;
