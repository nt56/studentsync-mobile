-- =============================================================================
-- Local demo data. Runs after migrations on `supabase db reset` (and `start`).
--
-- LOCAL ONLY. The password below is public. Staging accounts are created by
-- scripts/seed-staging.mjs with a password that never enters the repo.
--
-- Accounts (password for all: StudentSync1)
--   student@studentsync.test     student
--   organizer@studentsync.test   organizer
--   admin@studentsync.test       admin
--
-- Safe to run twice: every insert skips rows that already exist.
-- =============================================================================

-- Colleges: three verified, one pending, one rejected (hidden from pickers).
insert into public.colleges (id, name, location, status)
values
  ('10000000-0000-4000-8000-000000000001', 'Northfield Institute of Technology', 'Pune', 'verified'),
  ('10000000-0000-4000-8000-000000000002', 'Riverside College of Arts and Science', 'Bengaluru', 'verified'),
  ('10000000-0000-4000-8000-000000000003', 'Lakeview University', 'Hyderabad', 'verified'),
  ('10000000-0000-4000-8000-000000000004', 'Hillcrest School of Design', 'Chennai', 'pending'),
  ('10000000-0000-4000-8000-000000000005', 'Duplicate Test College', 'Nowhere', 'rejected')
on conflict (id) do nothing;

-- Accounts. Inserting into auth.users fires the sign-up trigger, which creates
-- profiles, profile_private and user_settings exactly as a real sign-up would.
-- Auth reads the token columns as strings, so they must be '' and not null.
with accounts (id, email, first_name, last_name, college_id) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'student@studentsync.test', 'Sam', 'Student', '10000000-0000-4000-8000-000000000001'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'organizer@studentsync.test', 'Olivia', 'Organizer', '10000000-0000-4000-8000-000000000001'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'admin@studentsync.test', 'Ada', 'Admin', null)
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', a.id, 'authenticated', 'authenticated', a.email,
  extensions.crypt('StudentSync1', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object(
    'first_name', a.first_name,
    'last_name', a.last_name,
    'college_id', a.college_id,
    -- Proves the trigger ignores a role in the metadata.
    'role', 'admin'
  ),
  now(), now(), '', '', '', ''
from accounts a
on conflict (id) do nothing;

-- Email sign-in also needs an identity row per user.
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@studentsync.test'
on conflict (provider_id, provider) do nothing;

-- Roles. The seed runs as the database owner, so it may set them directly; in
-- the app only the admin function (Phase 9) can.
update public.profiles set role = 'organizer' where id = '20000000-0000-4000-8000-000000000002';
update public.profiles set role = 'admin' where id = '20000000-0000-4000-8000-000000000003';
