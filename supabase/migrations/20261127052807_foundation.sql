-- =============================================================================
-- Phase 0: foundation
--
-- People and colleges: the tables every later phase builds on, the private
-- helpers that RLS policies call, and the trigger that turns a new Supabase
-- Auth user into a profile.
--
-- Two locks protect every table in `public`:
--   1. GRANTs decide which tables and columns a role may touch at all.
--   2. RLS policies decide which rows that role sees or changes.
-- Both must allow an action. Since October 2026 Supabase no longer grants new
-- tables to the API roles automatically, and we do not rely on it anyway: every
-- table first revokes everything, then grants exactly what it needs.
--
-- API roles: `anon` (signed out), `authenticated` (signed in), `service_role`
-- (server code with the secret key; it bypasses RLS but still needs grants).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Extensions
-- -----------------------------------------------------------------------------
-- citext: case-insensitive text, so "IIT Delhi" and "iit delhi" are the same
-- college name and the same email. pgcrypto: gen_random_bytes() and crypt().
-- Supabase keeps extensions in their own schema so they never clutter `public`.
create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;


-- -----------------------------------------------------------------------------
-- 2. The private schema
-- -----------------------------------------------------------------------------
-- The Data API only serves the schemas listed in config (`public`). Anything in
-- `private` cannot be called over HTTP. RLS policies still run as the caller,
-- so the API roles need USAGE on the schema to reach the helpers that policies
-- call. Each function below then grants EXECUTE one by one.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated, service_role;

-- Postgres lets everyone execute a new function by default. Turn that off for
-- functions created in `private` and `public` from now on, so forgetting a
-- REVOKE can never publish a function by accident.
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;


-- -----------------------------------------------------------------------------
-- 3. Enums
-- -----------------------------------------------------------------------------
-- Only the ones these tables use. Later phases add theirs.
create type public.user_role as enum ('student', 'organizer', 'admin');
create type public.gender as enum ('male', 'female', 'other', 'prefer_not_to_say');
create type public.college_status as enum ('pending', 'verified', 'rejected');
create type public.event_category as enum (
  'technical', 'workshop', 'cultural', 'competition',
  'seminar', 'sports', 'social', 'other'
);


-- -----------------------------------------------------------------------------
-- 4. Shared trigger and error helpers
-- -----------------------------------------------------------------------------

-- Keeps `updated_at` honest on every editable table.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function private.set_updated_at() from public, anon, authenticated;

-- The one way business errors are raised.
--
-- PostgREST turns SQLSTATE `PTxyz` into HTTP status xyz, so 'PT403' becomes a
-- 403 response. The stable code (NOT_ALLOWED, VALIDATION, ...) travels in
-- `hint`. The app decides on that code and never on the message text, so
-- messages can be reworded freely.
create function private.raise_error(p_code text, p_message text, p_status integer default 400)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_status integer := case when p_status between 400 and 599 then p_status else 500 end;
begin
  raise exception using
    errcode = 'PT' || v_status::text,
    message = p_message,
    hint = p_code;
end;
$$;
revoke execute on function private.raise_error(text, text, integer) from public;
-- Callable from validation triggers that run as the signed-in user. It only
-- raises, so letting the API roles execute it reveals nothing.
grant execute on function private.raise_error(text, text, integer) to anon, authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 5. colleges
-- -----------------------------------------------------------------------------
create table public.colleges (
  id uuid primary key default gen_random_uuid(),
  name extensions.citext not null,
  location text,
  status public.college_status not null default 'pending',
  -- Who suggested it and who decided. Foreign keys to profiles are added in
  -- section 7, once profiles exists (the two tables point at each other).
  submitted_by uuid,
  decision_reason text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint colleges_name_unique unique (name),
  constraint colleges_name_length check (char_length(name::text) between 3 and 200),
  constraint colleges_name_trimmed check (name::text = btrim(name::text)),
  constraint colleges_location_length check (location is null or char_length(location) <= 200),
  constraint colleges_decision_reason_length
    check (decision_reason is null or char_length(decision_reason) between 3 and 500)
);

comment on table public.colleges is
  'Colleges users and events belong to. Everyone reads the public columns; writes go through functions.';

create trigger colleges_set_updated_at
  before update on public.colleges
  for each row execute function private.set_updated_at();


-- -----------------------------------------------------------------------------
-- 6. profiles, profile_private, user_settings
-- -----------------------------------------------------------------------------

-- `id` equals the auth user ID but has no foreign key to auth.users on purpose:
-- when an account is deleted (Phase 9) the anonymized profile stays, so past
-- attendance and events keep pointing at "Deleted user".
create table public.profiles (
  id uuid primary key,
  first_name text not null,
  last_name text not null default '',
  avatar_path text,
  role public.user_role not null default 'student',
  college_id uuid references public.colleges (id) on delete restrict,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Looser than the app's forms (2-50): OAuth providers may give one letter.
  constraint profiles_first_name_length check (char_length(first_name) between 1 and 50),
  constraint profiles_first_name_trimmed check (first_name = btrim(first_name)),
  constraint profiles_last_name_length check (char_length(last_name) <= 50),
  constraint profiles_last_name_trimmed check (last_name = btrim(last_name)),
  constraint profiles_avatar_path_length check (avatar_path is null or char_length(avatar_path) <= 300)
);

comment on table public.profiles is
  'One row per account. Role changes only through admin functions; users edit names, avatar and college.';

-- Foreign key columns get an index so joins and "refuse while in use" checks
-- don't scan the table.
create index profiles_college_id_idx on public.profiles (college_id);
create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();


-- Kept in a separate table so that a future "show other people's names"
-- feature can never leak an email or phone number by selecting too much.
create table public.profile_private (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  -- Copied from auth.users by triggers. Nullable because account deletion
  -- (Phase 9) clears it.
  email extensions.citext,
  phone text,
  gender public.gender,
  date_of_birth date,
  bio text,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Backstops. The validation trigger below raises a friendlier VALIDATION
  -- error before these are reached.
  constraint profile_private_phone_format check (
    phone is null
    or (phone ~ '^\+?[0-9 ()-]+$'
        and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 15
        and char_length(phone) <= 20)
  ),
  constraint profile_private_bio_length check (bio is null or char_length(bio) <= 500)
);

comment on table public.profile_private is
  'Personal details readable only by the owner and admins.';

create trigger profile_private_set_updated_at
  before update on public.profile_private
  for each row execute function private.set_updated_at();


create table public.user_settings (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  reminders_enabled boolean not null default true,
  email_enabled boolean not null default true,
  push_enabled boolean not null default true,
  interests public.event_category[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_settings is
  'Notification preferences and interests. The owner reads and updates their own row.';

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function private.set_updated_at();


-- -----------------------------------------------------------------------------
-- 7. Foreign keys from colleges back to profiles
-- -----------------------------------------------------------------------------
alter table public.colleges
  add constraint colleges_submitted_by_fkey
    foreign key (submitted_by) references public.profiles (id) on delete set null,
  add constraint colleges_decided_by_fkey
    foreign key (decided_by) references public.profiles (id) on delete set null;

create index colleges_submitted_by_idx on public.colleges (submitted_by);
create index colleges_decided_by_idx on public.colleges (decided_by);


-- -----------------------------------------------------------------------------
-- 8. Validation triggers
-- -----------------------------------------------------------------------------
-- These run as the signed-in user (not security definer). They exist because
-- some rules cannot be CHECK constraints: a CHECK must give the same answer
-- forever, and "at least 16 years old" changes with today's date.

create function private.validate_profile_private()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.phone is not null then
    new.phone := nullif(btrim(new.phone), '');
  end if;
  if new.phone is not null and not (
    new.phone ~ '^\+?[0-9 ()-]+$'
    and char_length(regexp_replace(new.phone, '[^0-9]', '', 'g')) between 10 and 15
    and char_length(new.phone) <= 20
  ) then
    perform private.raise_error('VALIDATION', 'Enter a phone number with 10 to 15 digits.', 400);
  end if;

  if new.date_of_birth is not null and (
    new.date_of_birth > (current_date - interval '16 years')::date
    or new.date_of_birth < date '1900-01-01'
  ) then
    perform private.raise_error('VALIDATION', 'You must be at least 16 years old.', 400);
  end if;

  if new.bio is not null and char_length(new.bio) > 500 then
    perform private.raise_error('VALIDATION', 'Bio can be at most 500 characters.', 400);
  end if;

  return new;
end;
$$;
revoke execute on function private.validate_profile_private() from public, anon, authenticated;

create trigger profile_private_validate
  before insert or update on public.profile_private
  for each row execute function private.validate_profile_private();


-- Names are trimmed, and a user can't pick a rejected college.
create function private.validate_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.first_name := btrim(new.first_name);
  new.last_name := btrim(coalesce(new.last_name, ''));

  if char_length(new.first_name) not between 1 and 50 then
    perform private.raise_error('VALIDATION', 'First name must be 1 to 50 characters.', 400);
  end if;
  if char_length(new.last_name) > 50 then
    perform private.raise_error('VALIDATION', 'Last name can be at most 50 characters.', 400);
  end if;

  if new.college_id is not null
     and (tg_op = 'INSERT' or new.college_id is distinct from old.college_id)
     and not exists (
       select 1 from public.colleges c
       where c.id = new.college_id and c.status <> 'rejected'
     ) then
    perform private.raise_error('VALIDATION', 'Choose a college from the list.', 400);
  end if;

  return new;
end;
$$;
revoke execute on function private.validate_profile() from public, anon, authenticated;

create trigger profiles_validate
  before insert or update on public.profiles
  for each row execute function private.validate_profile();


-- Interests are a set: duplicates are removed rather than refused.
create function private.normalize_user_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.interests := coalesce(
    array(select distinct i from unnest(new.interests) as i order by i),
    '{}'
  );
  return new;
end;
$$;
revoke execute on function private.normalize_user_settings() from public, anon, authenticated;

create trigger user_settings_normalize
  before insert or update on public.user_settings
  for each row execute function private.normalize_user_settings();


-- -----------------------------------------------------------------------------
-- 9. Caller helpers used by RLS policies
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER: these run with the owner's rights, so they can read
-- `profiles` even though RLS would hide other rows from the caller. Without
-- that, a policy on `profiles` that asks "is the caller an admin?" would query
-- `profiles` again, run the same policy, and loop forever.
--
-- Because they bypass RLS, each one:
--   * sets search_path = '' and names every object with its schema, so nobody
--     can slip in a look-alike `profiles` table earlier in the path;
--   * only ever answers a question about the caller (auth.uid()), never about
--     an arbitrary user;
--   * is executable by `authenticated` and `service_role` only.

-- The signed-in caller's role, or null when signed out or deleted.
create function private.caller_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.deleted_at is null;
$$;

-- Signed in and the profile is not deleted. A deleted account fails every
-- policy at once, even while its token is still valid.
create function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.deleted_at is null
  );
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.caller_role() = 'admin', false);
$$;

revoke execute on function private.caller_role() from public, anon;
revoke execute on function private.is_active_user() from public, anon;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.caller_role() to authenticated, service_role;
grant execute on function private.is_active_user() to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 10. Sign-up: auth.users -> profiles, profile_private, user_settings
-- -----------------------------------------------------------------------------
-- Supabase Auth owns `auth.users`. This trigger runs inside the same
-- transaction as the sign-up, so either all four rows exist or none do.
--
-- The sign-up metadata (raw_user_meta_data) is typed by the user, so:
--   * the role is NEVER read from it: every new account is a student;
--   * invalid optional fields become null instead of failing the sign-up. The
--     app validates the form first, and complete-profile asks again.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_first text := nullif(btrim(meta ->> 'first_name'), '');
  v_last text := nullif(btrim(meta ->> 'last_name'), '');
  v_full text;
  v_phone text := nullif(btrim(meta ->> 'phone'), '');
  v_gender_raw text := replace(lower(btrim(meta ->> 'gender')), '-', '_');
  v_gender public.gender;
  v_dob_raw text := nullif(btrim(meta ->> 'date_of_birth'), '');
  v_dob date;
  v_college_raw text := nullif(btrim(meta ->> 'college_id'), '');
  v_college uuid;
begin
  -- Names: explicit fields, then the OAuth full name, then the email's local part.
  if v_first is null then
    v_full := nullif(btrim(coalesce(meta ->> 'full_name', meta ->> 'name')), '');
    if v_full is not null then
      v_first := split_part(v_full, ' ', 1);
      v_last := coalesce(v_last, nullif(btrim(substr(v_full, char_length(v_first) + 1)), ''));
    end if;
  end if;
  if v_first is null then
    v_first := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;
  v_first := btrim(left(coalesce(v_first, 'Student'), 50));
  if v_first = '' then
    v_first := 'Student';
  end if;
  v_last := btrim(left(coalesce(v_last, ''), 50));

  -- Optional fields: keep only valid values.
  if v_phone is not null and not (
    v_phone ~ '^\+?[0-9 ()-]+$'
    and char_length(regexp_replace(v_phone, '[^0-9]', '', 'g')) between 10 and 15
    and char_length(v_phone) <= 20
  ) then
    v_phone := null;
  end if;

  if v_gender_raw in ('male', 'female', 'other', 'prefer_not_to_say') then
    v_gender := v_gender_raw::public.gender;
  end if;

  if v_dob_raw is not null and pg_input_is_valid(v_dob_raw, 'date') then
    v_dob := v_dob_raw::date;
    if v_dob > (current_date - interval '16 years')::date or v_dob < date '1900-01-01' then
      v_dob := null;
    end if;
  end if;

  if v_college_raw is not null and pg_input_is_valid(v_college_raw, 'uuid') then
    select c.id into v_college
    from public.colleges c
    where c.id = v_college_raw::uuid and c.status <> 'rejected';
  end if;

  insert into public.profiles (id, first_name, last_name, college_id)
  values (new.id, v_first, v_last, v_college);

  insert into public.profile_private (profile_id, email, phone, gender, date_of_birth)
  values (new.id, new.email, v_phone, v_gender, v_dob);

  insert into public.user_settings (profile_id)
  values (new.id);

  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();


-- Email changes in Auth (after the user confirms them) are copied over.
create function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profile_private
  set email = new.email
  where profile_id = new.id;
  return new;
end;
$$;
revoke execute on function private.handle_user_email_change() from public, anon, authenticated;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();


-- -----------------------------------------------------------------------------
-- 11. Grants
-- -----------------------------------------------------------------------------
-- Start from nothing, then grant exactly what each role needs. No API role
-- may INSERT or DELETE these rows: the sign-up trigger creates them and
-- account deletion (Phase 9) is a function.
revoke all on table public.colleges, public.profiles, public.profile_private, public.user_settings
  from public, anon, authenticated;

grant all on table public.colleges, public.profiles, public.profile_private, public.user_settings
  to service_role;

-- colleges: public columns only. Who submitted or decided stays admin-only
-- (admin functions in Phase 9). Note: `select *` fails for these roles; the
-- app always names the columns.
grant select (id, name, location, status) on table public.colleges to anon, authenticated;

-- profiles: a column-level UPDATE grant is what makes `role`, `deleted_at`
-- and `id` impossible to change from the app.
grant select on table public.profiles to authenticated;
grant update (first_name, last_name, avatar_path, college_id) on table public.profiles to authenticated;

-- profile_private: email follows Auth and is not editable here.
grant select on table public.profile_private to authenticated;
grant update (phone, gender, date_of_birth, bio) on table public.profile_private to authenticated;

grant select on table public.user_settings to authenticated;
grant update (reminders_enabled, email_enabled, push_enabled, interests)
  on table public.user_settings to authenticated;


-- -----------------------------------------------------------------------------
-- 12. Row-level security
-- -----------------------------------------------------------------------------
-- With RLS on and no matching policy, a role sees no rows at all. Each policy
-- names its role with TO, and wraps function calls in (select ...) so Postgres
-- evaluates them once per query instead of once per row.
alter table public.colleges enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.user_settings enable row level security;

-- colleges ------------------------------------------------------------------
create policy "Anyone can read colleges"
  on public.colleges for select
  to anon, authenticated
  using (true);

-- profiles --------------------------------------------------------------------
create policy "Users read their own profile; admins read all"
  on public.profiles for select
  to authenticated
  using (
    (id = (select auth.uid()) and deleted_at is null)
    or (select private.is_admin())
  );

-- UPDATE also needs the SELECT policy above to find the row. WITH CHECK stops
-- the row from being moved to another ID.
create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) and deleted_at is null)
  with check (id = (select auth.uid()) and deleted_at is null);

-- profile_private -------------------------------------------------------------
create policy "Users read their own private profile; admins read all"
  on public.profile_private for select
  to authenticated
  using (
    (profile_id = (select auth.uid()) and (select private.is_active_user()))
    or (select private.is_admin())
  );

create policy "Users update their own private profile"
  on public.profile_private for update
  to authenticated
  using (profile_id = (select auth.uid()) and (select private.is_active_user()))
  with check (profile_id = (select auth.uid()));

-- user_settings ---------------------------------------------------------------
create policy "Users read their own settings"
  on public.user_settings for select
  to authenticated
  using (profile_id = (select auth.uid()) and (select private.is_active_user()));

create policy "Users update their own settings"
  on public.user_settings for update
  to authenticated
  using (profile_id = (select auth.uid()) and (select private.is_active_user()))
  with check (profile_id = (select auth.uid()));
