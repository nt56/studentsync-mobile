-- The sign-up trigger: every new Auth user becomes a student with three rows.
begin;
\ir ../helpers.psql
select no_plan();

insert into public.colleges (id, name, status)
values ('30000000-0000-4000-8000-000000000001', 'Open College', 'verified'),
       ('30000000-0000-4000-8000-000000000002', 'Closed College', 'rejected');

-- Email sign-up with a full, valid form.
select tests.create_user('full@test.local', jsonb_build_object(
  'first_name', '  Priya ', 'last_name', 'Sharma', 'phone', '+91 98765 43210',
  'gender', 'prefer-not-to-say', 'date_of_birth', '2001-05-20',
  'college_id', '30000000-0000-4000-8000-000000000001',
  'role', 'admin'
)) as full_user \gset

select results_eq(
  format('select first_name, last_name, role::text, college_id from public.profiles where id = %L', :'full_user'),
  $$values ('Priya', 'Sharma', 'student', '30000000-0000-4000-8000-000000000001'::uuid)$$,
  'the profile is filled from the form, trimmed, and the role is always student');
select results_eq(
  format('select email::text, phone, gender::text, date_of_birth from public.profile_private where profile_id = %L', :'full_user'),
  $$values ('full@test.local', '+91 98765 43210', 'prefer_not_to_say', '2001-05-20'::date)$$,
  'private details are stored; the web''s hyphenated gender is accepted');
select is((select count(*) from public.user_settings where profile_id = :'full_user'), 1::bigint,
  'settings are created');

-- Bad optional fields are dropped, not fatal.
select tests.create_user('bad@test.local', jsonb_build_object(
  'first_name', 'Ravi', 'phone', '123', 'gender', 'robot',
  'date_of_birth', 'not a date', 'college_id', '30000000-0000-4000-8000-000000000002'
)) as bad_user \gset
select results_eq(
  format($$select p.college_id, pp.phone, pp.gender::text, pp.date_of_birth
           from public.profiles p join public.profile_private pp on pp.profile_id = p.id
           where p.id = %L$$, :'bad_user'),
  $$values (null::uuid, null::text, null::text, null::date)$$,
  'invalid phone, gender, birth date and a rejected college become null');

select tests.create_user('young@test.local', jsonb_build_object(
  'first_name', 'Kid', 'date_of_birth', to_char(current_date - interval '10 years', 'YYYY-MM-DD'),
  'college_id', 'not-a-uuid'
)) as young_user \gset
select is((select date_of_birth from public.profile_private where profile_id = :'young_user'), null,
  'a birth date under 16 is dropped');

-- OAuth sign-ups send a full name instead.
select tests.create_user('oauth@test.local', '{"full_name": "Grace Brewster Hopper"}') as oauth_user \gset
select results_eq(
  format('select first_name, last_name from public.profiles where id = %L', :'oauth_user'),
  $$values ('Grace', 'Brewster Hopper')$$,
  'an OAuth full name is split into first and last name');

select tests.create_user('noname.person@test.local') as noname_user \gset
select results_eq(
  format('select first_name, last_name from public.profiles where id = %L', :'noname_user'),
  $$values ('noname.person', '')$$,
  'with no name at all, the email''s local part is used');

-- Email changes in Auth are copied.
update auth.users set email = 'renamed@test.local' where id = :'full_user';
select is((select email::text from public.profile_private where profile_id = :'full_user'),
  'renamed@test.local', 'an email change in Auth reaches profile_private');

select * from finish();
rollback;
