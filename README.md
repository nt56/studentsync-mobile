# StudentSync Mobile

One place for college events: students discover and join them, organizers run them, and admins look after the platform. An Android and iOS app built with Expo, with its own Supabase backend.

**Status:** system design written and a Supabase project connected in config. The database is not built yet, and the screens in `src/` are still the earlier student app made for the StudentSync web server. They are replaced phase by phase.

## Documentation

Working rules for contributors and AI assistants are in [AGENTS.md](AGENTS.md). The design documents live in a local `docs/` folder that is not part of this repository.

## Stack

Expo SDK 58 · React Native 0.88 · TypeScript · expo-router · NativeWind · Redux Toolkit Query · Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) · SQLite for offline use.

## Run the current app

Needs Node 22.13+ and an Android development build (Expo Go is not supported).

```sh
npm ci
cp .env.example .env   # then fill in the Supabase URL and publishable key
npm run check:env
npm run android        # first time, builds the development client
npm run start:dev-client
npm run validate       # types, lint, tests
```

The old screens only load data if `.env` also sets `EXPO_PUBLIC_API_URL` to a running web server.
