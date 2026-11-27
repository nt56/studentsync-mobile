# 00: Backend foundation (Phase 0)

Status: **done locally; the staging deploy waits for your GitHub secrets** (see "You need to"). Written, approved and built November 27, 2026.

## Goal

A fresh clone can run `npx supabase start`, reset the local database, and pass the database tests. Staging gets the same schema automatically when a change merges to `main`. The app gets generated database types. No screens change.

## Decisions

Asked and answered on November 27, 2026:

| Question | Answer |
| --- | --- |
| Cloud region | Keep the existing staging project as it is. Production picks its region in Phase 10. |
| Staging deploy | Automatic on merge to `main`, after the database tests pass. |
| Schema workflow | Hand-written, commented migrations from `supabase migration new`. Not declarative schemas. |
| Seed data | Local and staging. |

Defaults I picked (say if you want any changed):

- **Supabase CLI v3** (3.4.0 at the time of writing) as a dev dependency, run through `npx supabase`. Since v3 the CLI targets the **local** stack by default. Hosted commands need `--remote`, and in CI also `--yes`, because the CLI refuses to change a hosted project without confirmation.
- **Phase 0 creates only the enums its tables use:** `user_role`, `gender`, `college_status`, and `event_category`, which `user_settings.interests` needs. Every other enum arrives with the phase that uses it.
- **Extensions now:** `citext` and `pgcrypto` only. `pg_cron`, `pg_net` and `pg_trgm` arrive in the phase that needs them.
- **`private.current_role()` is renamed `private.caller_role()`.** `current_role` is a reserved SQL word, so a function with that name is a trap. `docs/DATABASE.md` is updated to match.
- **Seed passwords differ by environment.** Local accounts use one known password, written in `seed.sql` and in this plan. Staging accounts are created by a script that reads the password from your shell, so it never enters the repo. If the repo is public, a password committed to it would let anyone sign in to staging as admin.
- **Database length rules are looser than the forms.** First name is 1 to 50 characters and last name 0 to 50, because Google or GitHub may return a one-letter or empty name. The app forms keep requiring 2 to 50.
- **Age and phone rules** are checked by a trigger, not a `check` constraint. The age check uses today's date, and a `check` constraint must give the same answer every time it runs.
- **Bad optional sign-up data is dropped, not rejected.** The sign-up trigger stores `null` for an invalid phone, gender, birth date or college. The account is still created, and the complete-profile screen asks again. A failing trigger would block sign-up with an unhelpful error.

## What you will learn

- **Migrations:** versioned SQL files that build the schema step by step. The same files run on your laptop, in CI and on staging, so all three stay identical.
- **Schemas `public` and `private`:** the API only reaches `public`. Helpers live in `private`, so nobody can call them over HTTP. Policies can still use them, because the database roles get `usage` on the schema without it being exposed.
- **Grants and RLS are two separate locks.** A grant decides which tables and columns a role may touch at all. RLS decides which rows it sees. Since October 2026, new Supabase tables have no API access until you grant it, so every table here gets explicit grants.
- **Column grants:** `grant update (first_name, last_name, avatar_path, college_id)` is how a user edits their profile without ever being able to update `role`.
- **`security definer`:** a function that runs with its owner's rights. It is only used where the caller may not read the data (for example "is this caller an admin?"). Each one has an empty `search_path`, so nobody can slip in a look-alike table.
- **Triggers on `auth.users`:** Supabase Auth owns that table. A trigger copies each new user into our own tables in the same transaction.
- **pgTAP:** SQL unit tests. Each test file runs in a transaction that is rolled back, so tests never leave data behind.

## Backend

### Folder layout

```text
supabase/
  config.toml or config.jsonc  # whichever `supabase init` creates (3.4.0 writes jsonc)
  migrations/
    <timestamp>_foundation.sql
  seed.sql
  tests/database/
    000_helpers.sql        # or inline helpers, see "Test helpers"
    001_schema_hygiene.test.sql
    010_profiles.test.sql
    020_profile_private.test.sql
    030_user_settings.test.sql
    040_colleges.test.sql
    050_signup_trigger.test.sql
    060_errors.test.sql
```

`config` changes from the defaults: project ID `student-synch-mobile`; auth `site_url` and redirect `studentsync://auth/callback`; email sign-up with confirmation on, so local matches staging. Phase 1 sets up the full auth settings.

### Migration `foundation`

Written in this order, with a comment per block explaining it:

1. **Extensions:** `citext` and `pgcrypto` in schema `extensions`.
2. **Schema `private`:** revoke everything from `public`, `anon` and `authenticated`. Then grant `usage` to `anon`, `authenticated` and `service_role`, so policies can call the helpers. The schema is never added to the API's exposed schemas.
3. **Enums:** `user_role`, `gender`, `college_status`, `event_category`.
4. **`private.set_updated_at()`:** a trigger function used by every editable table.
5. **`private.raise_error(code, message, status)`:** the one place errors are raised. It uses PostgREST's custom error form (SQLSTATE `PGRST`, with JSON giving the HTTP status, and the stable code in `hint`). Check the exact format in the current PostgREST docs before writing it.
6. **`colleges`:** `id`, `name citext unique` (3 to 200), `location` (at most 200), `status` default `pending`, `submitted_by`, `decision_reason`, `decided_by`, `decided_at`, `created_at`, `updated_at`. Its foreign keys to `profiles` are added after `profiles` exists, set to null on delete.
7. **`profiles`:** `id uuid primary key` (equal to the auth user ID, with no foreign key, so an anonymized profile survives account deletion), `first_name` (1 to 50, trimmed), `last_name` (0 to 50, default `''`), `avatar_path`, `role` default `student`, `college_id` referencing colleges (`on delete restrict`), `deleted_at`, timestamps. Indexes on `college_id` and `role`.
8. **`profile_private`:** `profile_id` primary key referencing profiles (cascade), `email citext not null`, `phone` (10 to 15 digits), `gender`, `date_of_birth`, `bio` (at most 500), `deletion_requested_at`, timestamps. The `private.validate_profile_private` trigger checks phone and age 16+, and refuses with `VALIDATION`.
9. **`user_settings`:** `profile_id` primary key (cascade), `reminders_enabled`, `email_enabled`, `push_enabled` (all default true), `interests event_category[]` default `'{}'` (no duplicates), timestamps.
10. **Helpers in `private`** (all `stable`, `security definer`, `search_path = ''`, `execute` only for `authenticated` and `service_role`):
    - `caller_role()`: the role of `auth.uid()`, or `null` when the caller is signed out or the profile is deleted.
    - `is_active_user()`: signed in and the profile is not deleted.
    - `is_admin()`: `caller_role() = 'admin'`.
11. **Sign-up trigger** `private.handle_new_user()` after insert on `auth.users`. In one transaction it creates `profiles`, `profile_private` (email) and `user_settings`. It reads `first_name`, `last_name`, `phone`, `gender`, `date_of_birth` and `college_id` from the sign-up metadata. For OAuth it falls back to `full_name` or `name`, and then to the part of the email before the `@`. It **never reads a role**. The college must exist and not be rejected.
12. **Email sync trigger** `private.handle_user_email_change()` after update of `email` on `auth.users`: copies the new email to `profile_private`.
13. **RLS and grants.** RLS is on for every table, and every policy names its role with `to`:

| Table | `anon` | `authenticated` | Policies |
| --- | --- | --- | --- |
| `colleges` | select (`id`, `name`, `location`, `status`) | same | Everyone reads. No direct writes (functions from Phase 2 and 9). |
| `profiles` | none | select all columns; update `first_name`, `last_name`, `avatar_path`, `college_id` | Read: self or admin. Update: self and active, `with check` also self. |
| `profile_private` | none | select; update `phone`, `gender`, `date_of_birth`, `bio` | Read: self or admin. Update: self and active. |
| `user_settings` | none | select; update the three flags and `interests` | Self and active only. |

`service_role` gets full grants on all four tables (the staging seed script and later Edge Functions use it). No table grants `insert` or `delete` to app users. Rows are created by the trigger, and deletion arrives with Phase 9.

Policies wrap helper calls as `(select private.is_admin())` and `(select auth.uid())`, so Postgres runs them once per query instead of once per row.

### Seed (`supabase/seed.sql`, local)

- Five demo colleges: three `verified`, one `pending`, one `rejected`.
- Three accounts, created in `auth.users` and `auth.identities` with confirmed email, so the sign-up trigger fills their profiles:
  - `student@studentsync.test`
  - `organizer@studentsync.test`
  - `admin@studentsync.test`
  - Local password for all three: `StudentSync1`.
- The roles are set afterwards with a direct `update` (the seed runs as the database owner).
- Safe to run twice: `on conflict do nothing`.

### Staging seed (`scripts/seed-staging.mjs`, run by hand once)

- Reads `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `SEED_PASSWORD` from your shell, never from `.env` or the repo.
- Creates the same colleges and the three accounts through the Auth Admin API (`email_confirm: true`), then sets their roles.
- Safe to rerun: it skips accounts and colleges that already exist.
- npm script: `db:seed:staging`.

### Test helpers

pgTAP comes from `create extension if not exists pgtap with schema extensions` at the top of each test.

The helpers do three things: create a test user in `auth.users` (so the trigger runs), act as a user (`set local role authenticated` plus `request.jwt.claims` with `sub`), and act as `anon`. They live in `000_helpers.sql` and are included with `\ir` if the CLI's `pg_prove` supports it. If it does not, each file defines the helpers inline in a `tests` schema that the rollback removes. This is checked first during the build.

### Tests (all must pass)

- **Schema hygiene:**
  - Every table in `public` has RLS enabled.
  - Every `security definer` function in `public` and `private` sets `search_path` to `''`.
  - `anon` and `authenticated` cannot execute any `private` function other than the three helpers.
  - `anon` has no grant on any `public` table except the `colleges` columns.
- **`profiles`:**
  - A user reads their own profile but not another user's.
  - An admin reads everyone's.
  - `anon` reads nothing.
  - A user updates their names, but updating `role`, `deleted_at` or `id` fails with `permission denied`.
  - A user cannot update another user's row (0 rows changed).
  - A deleted profile can no longer read or update itself.
  - Direct insert and delete are refused.
- **`profile_private`:** owner and admin read; others and `anon` don't; email is not updatable; a bad phone and an age under 16 raise `VALIDATION`.
- **`user_settings`:** owner reads and updates; no one else does.
- **`colleges`:** `anon` and `authenticated` read the public columns. Reading `submitted_by` or `decision_reason` is refused. All writes are refused. Duplicate names differing only in case are refused.
- **Sign-up trigger:**
  - A new auth user gets all three rows.
  - A `role` in the metadata is ignored.
  - Bad optional fields become `null`.
  - A rejected or unknown college is dropped.
  - The OAuth name falls back correctly.
  - An email change in auth is copied to `profile_private`.
- **Errors:** `private.raise_error('NOT_ALLOWED', …, 403)` raises with the code in `hint`.

## App

- `src/types/database.ts`, generated with `supabase gen types` from the local stack. It is checked in, and CI fails when it is out of date.
- `src/lib/supabase.ts`: `createClient<Database>(…)`. Nothing else changes, and nothing imports it yet.
- `scripts/check-env.cjs` already allows only the Supabase URL and the publishable key, and rejects secret keys. I'll confirm it accepts the local URLs (`http://127.0.0.1:54321`, `http://10.0.2.2:54321`) outside production, and add a Jest case for each.
- New npm scripts: `db:start`, `db:stop`, `db:reset`, `db:test`, `db:lint`, `db:types`, `db:seed:staging`.

## CI (`.github/workflows/database.yml`)

- **Triggers:** pull requests and pushes to `main` that change `supabase/**`, `src/types/database.ts` or the workflow.
- **Job `test`:**
  1. `npm ci`.
  2. `npx supabase start`, skipping services the tests don't need (Studio, Storage, Realtime, and others) to save time.
  3. `npx supabase db reset`.
  4. `npx supabase test db`.
  5. `npx supabase db lint`, using whatever form of the command v3 has.
  6. Regenerate the types, then `git diff --exit-code src/types/database.ts`.
- **Job `deploy-staging`:**
  - Runs after `needs: test`, only on push to `main`, in a GitHub environment named `staging`.
  - Runs `npx supabase db push --remote --yes`, using `SUPABASE_ACCESS_TOKEN` (a token scoped to this project), `SUPABASE_DB_PASSWORD` and the project ref.
  - Before writing this job, check `db push --help` and the v3 docs for the exact way to point it at the project in CI.
  - It never sends seed data.

## Files

New:

- `supabase/` (config, the migration, `seed.sql`, tests)
- `scripts/seed-staging.mjs`
- `src/types/database.ts`
- `.github/workflows/database.yml`

Changed:

- `package.json`: CLI dev dependency and scripts.
- `src/lib/supabase.ts`: types.
- `__tests__/environment.test.ts`: local URL cases.
- `.gitignore`: `supabase/.temp`, `supabase/.branches`, if init doesn't add them.
- Docs: `docs/DATABASE.md`, `docs/OPERATIONS.md`, `docs/TECH_STACK.md`, `docs/ROADMAP.md`.
- `AGENTS.md`: "Current state".

## Progress

- [x] Plan approved
- [x] Docker Desktop running; CLI installed (`npx expo install` is not for CLIs: use `npm i -D supabase@3.4.0`, exact version)
- [x] `supabase init`, config adjusted, `supabase start` works
- [x] Test helper approach confirmed (`\ir` or inline)
- [x] PostgREST custom error format confirmed
- [x] Migration `foundation` written; `db reset` clean
- [x] pgTAP tests written and passing; `db lint` clean; advisors clean
- [x] `seed.sql`; sign-in as each seed account works (Auth API on the local stack)
- [x] Types generated; client typed; env tests added
- [x] `database.yml` with test and deploy jobs
- [x] `seed-staging.mjs`
- [x] Docs, AGENTS.md "Current state" and ROADMAP progress updated
- [x] Verification run and reported (step 8, the staging deploy, is still open)

## Verification

1. `npx supabase db reset` runs with no errors.
2. `npx supabase test db`: every test passes.
3. `npx supabase db lint` and the security advisors show no warnings.
4. Through the local Auth API, sign in as each seed account. Then, with that token, `GET /rest/v1/profiles` returns exactly the expected rows: one for student and organizer, three for admin.
5. With only the publishable key (signed out), `GET /rest/v1/colleges?select=id,name` works, and `select=submitted_by` and `GET /rest/v1/profiles` are refused.
6. Regenerating the types gives no diff.
7. `npm run validate` passes.
8. After you add the GitHub secrets and merge, the deploy job is green, and `npx supabase migration list --remote` shows staging matching local.

## You need to

1. Start Docker Desktop before the build session.
2. Create a Supabase personal access token scoped to the staging project only. Add it to GitHub as the secret `SUPABASE_ACCESS_TOKEN`, along with `SUPABASE_DB_PASSWORD` (the staging database password).
3. Add the staging project ref as the GitHub variable `SUPABASE_PROJECT_ID`, in an environment named `staging`.
4. After the first deploy, run `npm run db:seed:staging` once, with `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and a strong `SEED_PASSWORD` set in your shell only.

## Result

Built November 27, 2026. Everything runs locally. The staging deploy is written but has not run yet, because it needs the GitHub secrets above.

**Built:**

- **Supabase CLI:** 3.4.0, pinned exactly as a dev dependency. `supabase init` wrote `supabase/config.jsonc`. Auth settings changed: `site_url` is `studentsync://`, the redirect is `studentsync://auth/callback`, and email confirmation is on.
- **Migration** `supabase/migrations/20261127052807_foundation.sql`:
  - Extensions, the `private` schema, and four enums.
  - The four tables, each starting from revoked grants, then explicit grants and column grants.
  - RLS policies, validation triggers, and the three caller helpers plus `raise_error`.
  - The sign-up trigger and the email-sync trigger.
  - It also revokes default `execute` for future functions in `public` and `private`.
- **Seed:** `supabase/seed.sql` (local accounts, password `StudentSync1`). `scripts/seed-staging.mjs` does the same for staging through the Admin API, with the password taken from your shell.
- **Tests:** `supabase/tests/helpers.psql`, plus 7 test files with 76 tests.
- **Types:** `src/types/database.ts`, generated and formatted with Prettier. `src/lib/supabase.ts` is now `createClient<Database>`.
- **CI:** `.github/workflows/database.yml` with a test job, plus a staging deploy job on push to `main`.
- **npm scripts:** `db:start`, `db:stop`, `db:reset`, `db:test`, `db:lint` (lint plus advisors), `db:types`, `db:seed:staging`.

**Differences from the plan:**

- **Error format:** errors use SQLSTATE `PT<status>` with the code in `hint`, not the `PGRST` JSON form. The PostgREST docs say `PTxyz` sets HTTP status xyz, which is simpler and needs no JSON. Through the API, a bad phone returns HTTP 400 with `hint: "VALIDATION"`.
- **Test helpers:** they live in `supabase/tests/helpers.psql`. Each test includes them with `\ir ../helpers.psql`. The `.psql` extension stops the runner from treating the file as a test.
- **`raise_error` permissions:** it is also executable by the API roles, because validation triggers run as the signed-in user. It only raises, so this reveals nothing.
- **Extra validation:**
  - Profiles refuse a rejected college.
  - Names are trimmed.
  - Duplicate interests are removed instead of refused.
- **Gender spelling:** the sign-up trigger also accepts the web's spelling `prefer-not-to-say`.
- **Seed script:** `seed-staging.mjs` also accepts `http://127.0.0.1:…`, so it can be tried safely on the local stack.

**Learned:**

- **CLI v3:** every command targets the local stack. Hosted work needs `--remote=<ref>` and, in CI, `--yes`. `supabase test db <single file>` failed with "No plan found" when given one file path. Running it with no path works.
- **Column grants:** `select *` fails as soon as one column isn't granted. The app must always name columns on `colleges`.
- **Policy helpers:** they must be `security definer`. A policy on `profiles` that asks "is the caller an admin?" through an ordinary query would trigger the same policy again and never stop.
- **pgTAP:** an RLS refusal of an update shows up as "0 rows changed", not as an error. A missing grant shows up as SQLSTATE `42501`. The tests check each case in its own way.
- **Expo packages:** `expo-doctor` and `expo install --check` report 9 Expo packages one patch behind (`expo` 58.1.0 and others). This happened before Phase 0 and is not caused by it. The existing `validate.yml` step `npx expo install --check` will fail in CI until they are updated, which also needs a dev-client rebuild.

## Handoff

- **Next:** add the GitHub secrets and variable ("You need to" above), commit, and merge to `main`. Then check that the deploy job is green and that `npx supabase migration list --remote=<ref>` matches local. After that, run `npm run db:seed:staging` once.
- **Then:** Phase 1 (accounts and app shell). Ask its open decisions and write `prompts/01-…`.

**Update, November 27, 2026:** committed and pushed to `main` (`e37bb70`). On GitHub, the `Database` test job passed. `deploy-staging` failed at "Show pending migrations" (the dry run), so nothing reached staging. The cause is not known yet: job logs need a GitHub login. `Validate mobile` failed at `expo install --check` (outdated Expo patches).

**Fix, November 27, 2026:** the dry run failed because `SUPABASE_PROJECT_ID` was empty. The deploy job now also accepts it as a secret and first checks that all three settings are present. `jest-expo` updated to 58.0.16 for `Validate mobile`.
