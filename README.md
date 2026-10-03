# StudentSync Mobile

Student features for Android and iOS, connected to the existing StudentSync web backend. Built with Expo SDK 57, React Native 0.86, Expo Router, TypeScript, Redux Toolkit Query, NativeWind 4, and Reanimated 4.

## Phase 1

- Email/password sign-in, student registration, email verification, password recovery through the web, profile editing, and password changes.
- Event discovery with search, category, status, sorting, inter-college and own-college filters.
- Event end times and time zones, registration/cancellation, paginated tickets, QR check-in status, calendar export, maps, and sharing.
- Paginated saved events with complete bookmark membership.
- Authenticated event chat, earlier message history, typing indicators, and polling fallback.
- Persistent in-app notifications and saved email/reminder preferences, synchronized with the web.
- Optional local device reminders, reconciled when the app refreshes; these are not remote push notifications.
- Reviews, student activity, blue light/dark/system themes, shared animation timings, reduced-motion support, and safe-area-aware navigation.

Organizer and admin accounts are directed to the web app. Their mobile tools belong to phase 2.

## Run locally

Use Node 22.13+ (Node 24 is used in CI).

```sh
npm ci
```

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the origin running the web app's custom `server.ts`. REST and Socket.IO must be reachable at that origin. Use an HTTPS endpoint for release builds. Never put database, Redis, email-provider, or Cloudinary secrets in this repository's environment.

```sh
npm run check:env
npm run start:dev-client
```

Install a development build on your device first. Expo Go does not support the calendar module used here. After native dependency/config changes, regenerate native projects and rebuild the development client. Preserve any manual native edits before using `npx expo prebuild --clean`.

## Validate

```sh
npm run validate
npx expo install --check
npm run doctor
npm run export:native
```

CI runs types, lint, unit/contract regression tests, SDK compatibility, and Android/iOS bundle exports using a placeholder API origin. It does not access the live database or exercise real accounts.

## Build

`eas.json` includes `development`, `development-simulator`, `preview`, and `production` profiles. The project ID is configured in `app.json`.

```sh
npx eas-cli@latest login
npx eas-cli@latest project:info
npm run build:android:preview
npm run build:ios:preview
```

Set `EXPO_PUBLIC_API_URL` in each EAS environment before building. EAS metadata commands can run without a local API URL; Metro and the build validation hook require it. See [phase-one release checks](docs/PHASE_1.md) for signing, device testing, and unresolved release requirements.

## Structure

```text
src/
  app/                 Expo Router routes and layouts
    (auth)/            Sign-in, sign-up, verification, recovery
    (tabs)/            Discovery, tickets, alerts, settings
    events/[id]/       Details, chat, reviews
    profile/           Edit profile, password, activity
    tickets/           QR ticket display
  components/          Shared UI and feature components
  constants/           API endpoints and limits
  hooks/               Auth, bookmarks, chat, reminder lifecycle
  lib/                 HTTP, session storage, theme, motion, scheduling
  providers/           Saved appearance preference and theme variables
  store/api/           Backend queries, mutations, pagination, preferences
  store/slices/        Local auth, bookmark membership, discovery filters
  types/               Student-facing API types
__tests__/             Regression tests
scripts/               Environment validation
.github/workflows/     CI validation
assets/                Brand assets
docs/                  Phase-one review and next-phase plan
```

`android/`, `ios/`, `.expo/`, and `node_modules/` are generated and ignored. App identity/native configuration belongs in `app.json`; environment checks belong in `app.config.ts`, Metro, and the build hook. The web repository remains the source of backend behavior.

- [Web parity and release checks](docs/PHASE_1.md)
- [Student improvements and organizer/admin roadmap](docs/NEXT_PHASE.md)
- [Dependency review](docs/DEPENDENCIES.md)
- [Expo 57 documentation](https://docs.expo.dev/versions/v57.0.0/)
