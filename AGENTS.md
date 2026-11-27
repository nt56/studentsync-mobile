# Expo HAS CHANGED

Read the exact versioned docs at <https://docs.expo.dev/versions/v58.0.0/> before writing any code. The `expo` major in `package.json` decides the version (currently 58, React Native 0.88, React 19.3). Minimums: iOS 16.4, Android 7 (API 24), Node 22.13.

## StudentSync Mobile

End-to-end mobile app for students, organizers and admins on Android and iOS, with its own Supabase backend in this repo. It matches the features of the StudentSync web app (`d:\Profession\Projects\Full Stack\student-sync`) but shares no server or data with it. The web repo is the reference for behavior; never change it from here. It is also a learning project: explain new backend concepts as they appear.

This file holds every decision that is still true. Deeper history lives in the Claude memory notes. `docs/` is gitignored by the user's choice: it exists only on this machine, so never delete it or expect it in a clone, CI or a git worktree, and don't force-add it.

| Doc | Read it for |
| --- | --- |
| `docs/TECH_STACK.md` | Tools, reasons, dependencies, free tier limits |
| `docs/SYSTEM_DESIGN.md` | Architecture, auth, flows, offline, security |
| `docs/DATABASE.md` | Tables, policies, functions, business rules, error codes |
| `docs/FEATURES.md` | Feature checklist, roles, routes |
| `docs/ROADMAP.md` | Phases and their open decisions |
| `docs/OPERATIONS.md` | Environments, secrets, migrations, tests, CI/CD, backups |

## Current state

Phase 0 is built: `supabase/` holds the CLI v3 config (`config.jsonc`), the `foundation` migration (colleges, profiles, profile_private, user_settings, `private` helpers, sign-up trigger), `seed.sql` and pgTAP tests; `.github/workflows/database.yml` tests the database and deploys migrations from `main` to the cloud staging project, which is seeded with the demo colleges and accounts. `src/lib/supabase.ts` holds the typed client (`src/types/database.ts`), which nothing imports yet. The rest of `src/` is the old student-only client of the web backend (axios, better-auth cookie, Socket.IO) and is replaced phase by phase from Phase 1. Don't add features to it. Check `docs/ROADMAP.md` for the current phase, and treat the docs as the target, not as what exists.

## Sessions and handoff

**Each feature is built in its own new session**, so nothing needed later may live only in a chat. Managing this handoff is the assistant's job; don't wait to be asked.

At the start of a session:

1. Read "Progress" in `docs/ROADMAP.md`, then the plan in `prompts/` that is in progress or next.
2. Check `git status` and `git log`. If the notes and the code disagree, trust the code and fix the notes.
3. Read only the docs and code the task needs.

At the end of a session, even if the work is unfinished:

1. Update the plan: status, `## Progress` checklist, and `## Result` (finished) or `## Handoff` (done, next step, open problems, decisions and why).
2. Update "Progress" in `docs/ROADMAP.md`, "Current state" here, and any doc the work made wrong.
3. Save to Claude memory only what the repo doesn't record (user preferences, account or machine facts, surprises). Fix or delete stale notes. Never store secrets.
4. Tell the user what is uncommitted and what to say to start the next session.

## Commands

```bash
npx expo install <package>  # ALWAYS for app packages (resolves SDK versions); CLIs like `supabase` use npm i -D --save-exact
npm run start:dev-client    # dev server for the development build (npm start = plain dev server)
npm run android             # expo run:android (dev build); npm run ios needs a Mac
npm run validate            # typecheck + lint + jest; run before calling anything done
npm run doctor              # expo-doctor
npx expo install --fix      # fix incompatible package versions
npm run build:android:dev   # EAS build scripts wrap `npx eas-cli@latest`; never bare `eas`
# Database (Docker Desktop must be running):
npm run db:start            # also db:stop, db:reset, db:test, db:lint (+ advisors), db:types
npx supabase <cmd> --remote=<ref>  # CLI v3 targets local by default; hosted needs --remote (+ --yes in CI)
```

## Expo

- Before touching an Expo, EAS, React Native or Supabase API, read its current docs. For Expo beyond the versioned docs, start from <https://docs.expo.dev/llms.txt>. Don't write version-specific APIs from memory.
- Routes live in `src/app/` (expo-router 58); the target map is in `docs/FEATURES.md`. Every file is a screen; keep components, hooks and utils outside `src/app/`. Gate with `Stack.Protected`.
- Path alias `@/*` points to `src/`. `assets/` is imported by relative path.
- `android/` is generated and gitignored; never edit it by hand. Configure native behavior in `app.json` and config plugins.
- Needs a development build, not Expo Go. Rebuild the dev client after any SDK or native-module change.
- `reactCompiler` is OFF (Expo bug breaks production export). Keep `tailwindcss` on `^3.4` (v4 breaks NativeWind).
- SDK 58 API traps: custom `tabBar` receives `{ state, descriptors, emitter, navigateToTab }` (no `navigation`); `expo-calendar` uses `Calendar.requestCalendarPermissions()`, `getCalendars()`, `calendar.createEvent()` (the `*Async` forms throw); notifications handler uses `shouldShowBanner`/`shouldShowList`; image picker uses `mediaTypes: ["images"]`; date picker is `@expo/ui/community/datetime-picker`.

## Who owns what

Each tool has one job. Ask before moving a responsibility to a different tool.

- **Backend:** Supabase only. No custom server.
- **Business rules:** SQL functions. Anything touching more than one row, a counter, a notification or an audit entry is a function, in one transaction.
- **Authorization:** RLS and permission functions in the database. UI gating is convenience only and follows `get_event_permissions`, never the global role.
- **Edge Functions:** only for outside services, secrets, or deleting logins.
- **Server data:** RTK Query calling `supabase-js` (no TanStack Query, no hand-rolled fetch state). Redux slices only for client state. Screens never import the Supabase client.
- **Offline:** encrypted `expo-sqlite` cache and outbox. Only check-in, bookmarks and notification read/dismiss queue.
- **Auth:** Supabase Auth; session in the encrypted database, its key in `expo-secure-store`.
- **Realtime:** private Broadcast channels carrying IDs only.
- **Async work:** `pg_cron`, `outbox_jobs`, Edge Functions. Email through Brevo, push through Expo.
- **Files:** Supabase Storage.
- **Forms:** `react-hook-form` + `zod`.
- **Styling:** NativeWind with tokens in `tailwind.config.js`, mirrored in `src/lib/colors.ts` and `global.css`. Use `cn()` to merge classes. Reuse `src/components/ui/` first.
- **Crash reporting:** Sentry, scrubbed. No product analytics.

## Database rules

- Load the `supabase` and `supabase-postgres-best-practices` skills before any Supabase or database work. Where they differ from this file or `docs/`, say so and ask.
- Change the schema only through a new file in `supabase/migrations/`. Never edit an applied one or click it together in the dashboard.
- Every `public` table: RLS on, explicit grants, policies, and pgTAP tests including refusals.
- `security definer` functions set `search_path = ''`, check the caller first, and revoke default `execute`.
- Event status and free seats are computed, never stored by the app. Lock the event row before changing seats.
- Errors carry a stable code in `hint`; the app decides on the code, never the text.
- After a schema change, regenerate `src/types/database.ts` and update `docs/DATABASE.md`.

## Rules

- Everything with `EXPO_PUBLIC_` is readable by anyone. Only the variables in `docs/OPERATIONS.md` are allowed there. The Supabase secret key never enters the app. Never commit `.env*` or database dumps.
- Never log tokens, passwords, emails or message content.
- Dates and times: store UTC with an IANA zone; use `date-fns` and `src/lib/event-time.ts`.
- Page through lists; don't load everything at once.
- Stay on free tiers. Ask before adding a dependency or service beyond `docs/TECH_STACK.md`, spending money, deploying to production, or deleting data. Prefer Expo modules.
- Whenever you need input from the user, ask through your tool's built-in question panel with two to four options, recommended first. Fall back to plain text only if no such panel exists.

## How we build features

For a phase, a new feature, or a change across several files. Small fixes and questions skip this.

1. **Understand.** Read the docs above, the code involved, the web app's equivalent, and current API docs.
2. **Ask.** Ask the phase's open decisions and any new real one in one batched round. Pick defaults for the rest and list them.
3. **Plan.** Write `prompts/NN-name.md` (next number; create the folder if missing): status, goal, screens and states, tables and functions, files, a `## Progress` checklist, verification. A fresh session must be able to build from it. A large phase gets one plan per feature. List it under "Progress" in `docs/ROADMAP.md`.
4. **IMPORTANT: stop and wait.** Write no app or backend code until the user approves the plan. Status goes `draft` → `approved` → `in progress` → `done`.
5. **Build** backend and tests first, then the app. Check each step and tick it off. If a step turns out wrong, stop and explain.
6. **Close out.** Run Verification and report. Add `## Result` (including what was learned) to the plan, set `Status: done`, and follow "Sessions and handoff". In this file, replace stale rules instead of appending, and keep it under 150 lines.

## Building from designs

Designs, when given, are attached in the chat. Screens must match them: layout, spacing, sizes, colors, type, radii, icons, and copy.

- Icons come from `@expo/vector-icons` (MaterialCommunityIcons) or `assets/`. Brand images come from `assets/`. Mark and list any placeholder.
- Map every color, spacing value, and radius to a token. Propose new tokens instead of hardcoding.
- Run the screen on an Android emulator or device. Open it with `adb shell am start -a android.intent.action.VIEW -d "studentsync://<route>"`, capture with `adb exec-out screencap -p > <path>.png`, compare, list every difference, fix, repeat.

## Reporting

End every piece of work that changes code with these headings in order, leaving out any that would be empty.

- **Done:** one line on the outcome, then files changed and what changed in each.
- **Verified:** each check with ✅ or ❌ and its evidence. List what wasn't checked as ❌ with the reason. Never mark ✅ without running it.
- **You need to:** numbered actions only the user can take (accounts, keys, dashboard settings, dev-client rebuilds).
- **Test it yourself:** numbered steps from a fresh start, ending with `Expected:`.
- **Notes:** defaults picked, trade-offs, and anything left for later.

## Checks

- `npm run validate` passes before any task is called done; from Phase 0 also `npx supabase test db` for backend changes. For native or config changes, also run `npx expo export --platform android --platform ios` and `npm run doctor`.
- Screens that load data handle loading (`Spinner`), error (`ErrorState`), empty (`EmptyState`) and offline states.
- Test sign-out then sign-in as a different account and role so nothing leaks (RTK cache, local database, slices, reminders, push token).
- Test keyboard behavior on Android for screens with inputs, light and dark themes, and airplane mode where offline applies.
- Failures are explained by cause: backend response, permissions, app state, or the code.
