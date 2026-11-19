# Expo HAS CHANGED

Read the exact versioned docs at <https://docs.expo.dev/versions/v58.0.0/> before writing any code. The `expo` major in `package.json` decides the version (currently 58, React Native 0.88, React 19.3). Minimums: iOS 16.4, Android 7 (API 24), Node 22.13.

## StudentSync Mobile

Student-only Expo React Native app for StudentSync: browse and filter college events, register, show QR tickets, bookmark, review, chat per event, get reminders and notifications, add events to the calendar, and see personal analytics. It is the mobile client of the existing StudentSync web app (Next.js + better-auth + Mongoose + Socket.IO, repo `d:\Profession\Projects\Full Stack\student-sync`) and talks to that backend as-is. Organizer and admin roles are web-only; `docs/NEXT_PHASE.md` is the roadmap.

This file holds every decision that is still true. Deeper history lives in the Claude memory notes.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm install: resolves SDK-compatible versions
npm run start:dev-client    # dev server for the development build (npm start = plain dev server)
npm run android             # expo run:android (dev build); npm run ios needs a Mac
npm run validate            # typecheck + lint + jest; run before calling anything done
npm run typecheck           # tsc --noEmit (__tests__ is excluded on purpose)
npm run lint                # expo lint (src/ only)
npm test                    # jest-expo; tests live in __tests__/*.test.ts
npm run doctor              # expo-doctor
npx expo install --fix      # fix incompatible package versions
npm run build:android:dev   # EAS build scripts wrap `npx eas-cli@latest`; never bare `eas`
```

## Expo

- Before touching an Expo, EAS, or React Native API, read the versioned docs above. For anything else, start from <https://docs.expo.dev/llms.txt>.
- Routes live in `src/app/` (expo-router 58). Groups: `(auth)` (sign-in, sign-up, verify-email, forgot-password) and `(tabs)` (events, my-events, notifications, settings), plus `events/[id]/{index,chat,reviews}`, `tickets/[registrationId]`, `profile/*`, `bookmarks`, `account-status`. Every file is a screen; keep components, hooks and utils outside `src/app/`.
- Auth gate is `Stack.Protected` in `src/app/_layout.tsx`: student → `(tabs)` and detail screens, non-student → `account-status`, signed out → `(auth)`. Add new screens inside the right guard.
- Path alias `@/*` points to `src/` (`@/lib/...`, `@/store/...`). `assets/` is imported by relative path.
- `android/` is generated and gitignored; never edit it by hand. Configure native behavior in `app.json` and config plugins. `app.config.ts` validates env on top of `app.json`.
- Needs a development build, not Expo Go: `expo-calendar`, `expo-notifications`, `expo-dev-client`. Rebuild the dev client after any SDK or native-module change.
- `reactCompiler` is OFF (Expo bug breaks production export). Keep `tailwindcss` on `^3.4` (v4 breaks NativeWind).
- SDK 58 API traps: custom `tabBar` receives `{ state, descriptors, emitter, navigateToTab }` (no `navigation`); `expo-calendar` uses `Calendar.requestCalendarPermissions()`, `getCalendars()`, `calendar.createEvent()` (the `*Async` forms throw); notifications handler uses `shouldShowBanner`/`shouldShowList`; image picker uses `mediaTypes: ["images"]`; date picker is `@expo/ui/community/datetime-picker`.

## Layout

- `src/components/ui/`: shared primitives (`Button`, `Input`, `FormField`, `Select`, `OptionGroup`, `DateField`, `Card`, `Badge`, `AnimatedPressable`, `AnimatedTabBar`, and in `states.tsx` `Spinner`, `EmptyState`, `ErrorState`; `misc.tsx` has `Avatar`, `CapacityBar`, `RatingStars`). Feature UI in `components/{events,chat,reviews,profile,settings}/`.
- `src/store/`: Redux Toolkit. `api/*-api.ts` are RTK Query endpoints injected into `api/base-api.ts` (tag types drive invalidation); `slices/` hold client state (`auth`, `bookmarks`, `filters`).
- `src/lib/`: `axios.ts` (HTTP client + 401 handling), `base-query.ts`, `session.ts` (cookie in SecureStore), `validators.ts`, `event-status.ts`, `event-time.ts`, `reminder-plan.ts`, `notifications.ts`, `calendar.ts`, `colors.ts`, `cn.ts`, `motion.ts`.
- `src/constants/api.ts`: base URL, `ENDPOINTS`, `LIMITS`, upload types. `src/types/`: response types per domain. `src/hooks/`: `use-auth`, `use-bookmarks`, `use-event-chat`, `use-reminders`, `use-debounced`.

## Who owns what

Each tool has one job. Ask before moving a responsibility to a different tool.

- **Auth:** better-auth on the backend. Mobile uses the four custom routes (register, login, sign-out, profile) and keeps the session cookie in `expo-secure-store` via `src/lib/session.ts`. Email verification is enforced; login returns 403 until verified.
- **Cookie rule:** better-auth's catch-all `/api/auth/*` routes reject non-GET requests that carry a Cookie but no Origin (React Native sends no Origin). `mayAttachCookie()` in `src/lib/axios.ts` withholds the cookie from them; keep new auth endpoints consistent with it.
- **Data:** RTK Query for all server data (no TanStack Query, no hand-rolled fetch state). Redux slices only for client state. Forms use `react-hook-form` + `zod` (`@hookform/resolvers`).
- **Real time:** event chat over `socket.io-client` at `SOCKET_PATH` on the same origin as the API (`use-event-chat.ts`). The API origin must be the host running the custom `server.ts`.
- **Local notifications:** `expo-notifications` schedules event reminders from `reminder-plan.ts`; Android channel `event-reminders`. There is no remote push yet.
- **Styling:** NativeWind with tokens in `tailwind.config.js`, mirrored in `src/lib/colors.ts` and `global.css`; light/dark via `AppThemeProvider`. Use `cn()` to merge classes.
- **Env:** only `EXPO_PUBLIC_API_URL` (and `EXPO_PUBLIC_PROJECT_ROOT`) are allowed; `scripts/check-env.cjs` rejects any other `EXPO_PUBLIC_*`. Per-build values live in `eas.json` profiles.
- **Analytics / crash reporting:** none today. Ask before adding any.

## Backend contract traps

- Phone numbers: the server strips non-digits then requires 10 to 15 digits, so formatted numbers (`+91 98765 43210`) are valid.
- Event status: `GET /api/events` returns a computed status, but `registration.event.status` and `/api/bookmarks` items return a stored, stale one. Recompute with `src/lib/event-status.ts`.
- Bookmarks are raw Mongo docs (populated `collegeId`/`organizerId`, no `isRegistered`); use `src/types/bookmark.ts`, not the event type. `DELETE /api/bookmarks/:eventId` takes the event id.
- `PATCH /api/auth/profile` needs a strict ISO-8601 `dateOfBirth` and a URL `profileImage`; register accepts plain `YYYY-MM-DD`.
- Upload returns `filePath` (not `url`). Chat messages use `_id` and a populated `senderId`. `DELETE /api/registrations` takes `?eventId=`.

## Rules

- Everything with `EXPO_PUBLIC_` is bundled and readable by anyone. Never put a secret behind it. Never commit `.env*`.
- Keep mobile consistent with the web app's behavior and design tokens. Never trust client checks for security; the backend scopes data and UI gating is only for convenience.
- Don't log session cookies, passwords, or personal data. Surface API errors through the normalized `ApiError` from `src/lib/base-query.ts` (`message`, `fieldErrors`), not raw axios errors.
- Dates and times: use `date-fns` and the helpers in `src/lib/event-time.ts`.
- Reuse `src/components/ui/` primitives before creating new ones. Lists page through the backend using the `LIMITS` in `src/constants/api.ts`; don't load everything at once.
- Ask before adding a dependency or service, changing the API contract the app relies on, or deleting data. Prefer Expo modules over third-party libraries.
- Backend changes are out of scope. Note them under "You need to" instead.
- Whenever you need input from the user, ask through your tool's built-in question panel with two to four options, recommended first. Fall back to plain text only if no such panel exists.

## How we build features

For a new feature or a change across several files. Small fixes and questions skip this.

1. **Understand.** Read the code involved, the web app's equivalent feature, and the current docs for the APIs you'll use. Don't write version-specific APIs from memory.
2. **Ask.** If a real decision is unclear (scope, visible behavior, data shape, differences from web), ask in one batched round. Pick defaults for the rest and list them.
3. **Plan.** Write `prompts/NN-feature-name.md` (next number; create the folder if missing) with: goal, screens and states, files to touch, API endpoints, verification. It must be self-contained so a fresh session can build from this file plus the plan.
4. **IMPORTANT: stop and wait.** Write no app code until the user approves the plan. On approval set `Status: approved`.
5. **Build** step by step, checking each one. If a step turns out wrong, stop and explain instead of redesigning.
6. **Close out.** Run the plan's Verification and give the Reporting below. Add a short `## Result` to the plan and set `Status: done`. Update this file: replace or remove rules that are no longer true instead of appending, and keep it under 150 lines.

## Building from designs

Designs, when given, are attached in the chat. Screens must match them: layout, spacing, sizes, colors, type, radii, icons, and copy.

- Icons come from `@expo/vector-icons` (MaterialCommunityIcons) or `assets/`. Brand images come from `assets/`, never recreated from a screenshot. If an asset is missing, use a marked placeholder and list it.
- Map every color, spacing value, and radius to a token in `tailwind.config.js` / `src/lib/colors.ts`. List values with no token as proposed new tokens instead of hardcoding them.
- After building, run the screen on an Android emulator or device (Windows has no iOS simulator). Open a screen with `adb shell am start -a android.intent.action.VIEW -d "studentsync://<route>"`, capture with `adb exec-out screencap -p > <path>.png`, compare, list every difference, fix, and repeat.

## Reporting

End every piece of work that changes code with these headings in order, leaving out any that would be empty.

- **Done:** one line on the outcome, then files changed and what changed in each.
- **Verified:** each check with ✅ or ❌ and its evidence. List what wasn't checked as ❌ with the reason. Never mark ✅ without running it.
- **You need to:** numbered actions only the user can take (env values, backend changes, dev-client rebuilds).
- **Test it yourself:** numbered steps from a fresh start, ending with `Expected:`.
- **Notes:** defaults picked, trade-offs, and anything left for later.

## Checks

- `npm run validate` (typecheck, lint, jest) passes before any task is called done. For native or config changes, also run `npx expo export --platform android --platform ios` and `npm run doctor`.
- Screens that load data handle loading (`Spinner`), error (`ErrorState`), and empty (`EmptyState`) states.
- Test sign-out then sign-in as a different student so no state (RTK cache, bookmarks, filters, scheduled reminders) leaks between sessions.
- Test keyboard behavior on Android for any screen with inputs, and both light and dark themes.
- Failures are explained by cause: backend response, permissions, app state, or the code.
