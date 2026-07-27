# StudentSync (Mobile)

A React Native (Expo SDK 57) companion app for **StudentSync**, a college event platform. This is the student-facing client — discover events, register, chat with attendees, get reminders, and manage your profile, all synced in real time with the existing StudentSync backend.

## Features

- **Auth** — sign up, sign in, email verification, forgot/change password, protected routes via Expo Router `Stack.Protected`
- **Event discovery** — browse, filter, and view event details
- **Registration & tickets** — register for events, view digital tickets, add events to your device calendar
- **Bookmarks** — save events for later
- **Real-time chat** — per-event chat rooms powered by Socket.IO
- **Notifications** — push notifications for event updates via `expo-notifications`
- **Reviews** — rate and review events after attending
- **Profile** — edit profile, view attendance analytics, change password

## Tech Stack

| Layer | Tech |
| --- | --- |
| Framework | Expo SDK 57, React Native 0.86, React 19, Expo Router |
| Language | TypeScript |
| State | Redux Toolkit + RTK Query, `redux-persist` |
| Styling | NativeWind v4 (Tailwind for React Native) |
| Forms & validation | `react-hook-form` + `zod` |
| Real-time | `socket.io-client` |
| Native APIs | `expo-calendar`, `expo-notifications`, `expo-image-picker`, `expo-secure-store` |
| Testing | Jest (`jest-expo`) |

The app talks to the existing StudentSync **Next.js + better-auth + Socket.IO** backend as-is — no backend changes required.

## Project Structure

```
src/
├── app/                # Expo Router screens (file-based routing)
│   ├── (auth)/          # Sign in, sign up, verify email, forgot password
│   ├── (tabs)/          # Home, my events, notifications, settings
│   ├── events/[id]/     # Event details, chat, reviews
│   ├── profile/         # Edit profile, analytics, change password
│   └── tickets/          # Digital ticket view
├── components/          # Reusable UI, chat, events, profile, reviews
├── store/               # Redux Toolkit store
│   ├── api/              # RTK Query API slices (auth, events, chat, bookmarks, notifications, registrations, reviews)
│   └── slices/           # Local UI/auth/bookmark/filter state
├── lib/                 # Axios client, event-status helpers, etc.
├── hooks/                # Custom hooks
└── types/                # Shared TypeScript types
```

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure the environment

   Create a `.env` file in the project root:

   ```env
   EXPO_PUBLIC_API_URL=https://your-backend-host.example.com
   ```

   This must point to the host running the StudentSync backend (`server.ts`), since it serves both the REST API and Socket.IO.

3. Start the app

   ```bash
   npm start
   ```

   Open it in a [development build](https://docs.expo.dev/develop/development-builds/introduction/), Android emulator, or iOS simulator. Some native features (calendar sync, etc.) require a dev build and won't work in Expo Go.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` / `npm run ios` | Run on a connected device/emulator |
| `npm run web` | Run in the browser |
| `npm run lint` | Lint with `expo lint` |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm test` | Run the Jest test suite |
| `npm run build:android:preview` / `npm run build:ios:preview` | EAS preview builds |

## Notes

- Requires Expo SDK 57 — several native APIs (`expo-calendar`, `expo-notifications`, `expo-image-picker`) changed significantly from earlier SDKs; see the [versioned Expo docs](https://docs.expo.dev/versions/v57.0.0/).
- `reactCompiler` is intentionally disabled in `app.json` due to a known Expo issue affecting production exports.
