# StudentSync Mobile: roadmap

Updated November 12, 2026. Status: **draft, waiting for approval.**

The web app and backend are complete through web Phase 5 (`student-sync/documents/NEXT_PHASE_ROADMAP.md`). Every feature below already has its API. **No phase needs a backend change.** The screen-to-endpoint map is in `student-sync/documents/API_CONTRACT.md` ("Mobile app: which API each screen uses"), and the response shapes are in `student-sync/lib/contracts/index.ts`.

## Decisions already made

| Topic | Decision |
| --- | --- |
| Who the app is for | Students and organizers. Admins stay web-only and keep seeing `account-status`. |
| Organizer scope | Door work and quick actions: owned and assigned events, QR scan, attendee search, manual check-in, counts, publish a draft, announcements, chat moderation, an analytics summary. Creating and editing events, staff management, collaborations, and CSV export stay on the web. |
| Student staff | A student who is an editor or volunteer on an event gets that event's door tools in the student app. They are gated by that event's `permissions`, never by the global role. |
| Order | Foundation, then student catch-up, then organizer. |
| Native Google sign-in | Included, in the last student phase. |

## How each phase runs

Phases go one at a time. At the start of a phase I ask the open decisions listed for it. I then write `prompts/NN-<phase>.md`, a self-contained plan with screens, states, files, endpoints and verification. **No code is written until you approve that plan** (the AGENTS.md workflow). Each phase ends with `npm run validate`, an Android run, and the AGENTS.md report.

## Overview

| # | Phase | User value | New dependency | Rebuild dev client |
| --- | --- | --- | --- | --- |
| 0 | Foundation and contract sync | The app matches today's backend | none | yes (SDK 58) |
| 1 | Never miss a seat | Waitlist, conflict hint, calendar feed | none | no |
| 2 | Find the right events | Recommendations, interests, saved searches, deep links | none | no |
| 3 | Push and offline tickets | Server push, tickets that work without signal | none (expo-notifications exists) | yes (push credentials) |
| 4 | Store-readiness | Account deletion, reports, privacy/support, Google sign-in | `@react-native-google-signin/google-signin` | yes |
| 5 | Role-aware app shell | Organizers and student staff get in | none | no |
| 6 | Door: check-in | Scan, search, manual check-in, counts | `expo-camera` (to confirm) | yes |
| 7 | Organizer quick actions | Publish, announce, moderate, analytics | none planned | no |

---

## Phase 0: Foundation and contract sync

**Why:** an SDK 57→58 upgrade is uncommitted in the working tree, and the mobile types have drifted from the backend. Every later phase depends on both.

### Scope

- Finish the SDK 58 upgrade: `npx expo install --fix`, `npm run validate`, `npm run doctor`, `npx expo export`, then rebuild the dev client and commit. Update the memory notes, which still say SDK 57.
- Resync types with `lib/contracts`:
  - add the `competition` category and the `draft` status
  - add `seatsHeld` and `publishedAt` to events
  - add `export` and `announce` to `permissions`
  - add the 7 missing notification types (`announcement`, `waitlist_offer`, `waitlist_expired`, `saved_search_match`, `report_resolved`, `college_decision`, `event_hidden`)
  - add `push` to preferences
- Notifications: switch to the `(createdAt, id)` cursor (`nextCursor` → `?before=`) with "load older". Each new type gets an icon and a tap target from its `link`.
- Chat: send `before` together with `beforeId` when loading older messages, so messages sharing a timestamp are never skipped.
- Free seats become `capacity − registrationCount − seatsHeld` everywhere (capacity bar, register button).

**Open decisions:** whether to copy `lib/contracts/index.ts` into the app as runtime Zod schemas (types derived with `z.infer`, responses parsed in tests) or keep hand-written types updated by hand.

**Done when:** validate, doctor and export pass on SDK 58. Every notification type renders. Older notifications and chat pages load without gaps.

## Phase 1: Never miss a seat

### Scope

- **Waitlist on event detail:**
  - Show a join button when the event is full or a queue exists, and the position while waiting.
  - Show an offer with an accept/decline countdown (12 hours, cut short at the registration deadline).
  - Handle "Join the waitlist" 400s from register, and show waiting/offered state in My Events.
  - Endpoints: `GET/POST/DELETE /api/events/{id}/waitlist`, `POST …/waitlist/accept`.
- **Schedule conflict hint** before registering (`GET /api/events/{id}/conflicts`). It warns but never blocks.
- **Calendar subscription** in Settings: create, copy or open the `webcal` link, show its status, revoke it (`/api/users/me/calendar-feed`). The URL is shown only once.
- `waitlist_offer` and `waitlist_expired` notifications open the event.

**Open decisions:** whether the offer gets a local countdown reminder (for example 1 hour before it expires) until Phase 3 push exists.

**Done when:** join, position, offer, accept, decline and expiry all match the web. Retrying keeps the same position.

## Phase 2: Find the right events

### Scope

- **Recommended for you** row on the Events tab (`GET /api/events/recommended`), showing each item's reason `label`s.
- **Interests picker** in Settings and as a first-run prompt for new students (`/api/users/me/interests`).
- **Saved searches** in Settings, at most 10:
  - save the current filters with a name; filters are fixed once saved
  - toggle alerts, rename, delete, and apply one to Browse
  - handle the 409 on duplicate names
  - `saved_search_match` notifications open the event
- **Deep links** with the web's parameter names (`studentsync://events?category=…&collegeId=…`). Invalid values are ignored.

**Open decisions:** whether interests are asked on first launch or only offered in Settings, and where the recommendations row sits (above the list or as a separate filter chip).

**Done when:** a new student with no history still sees recommendations, and a saved search reproduces the same results.

## Phase 3: Push and offline tickets

### Scope

- **Remote push:**
  - after sign-in, request permission and register the Expo token (`POST /api/devices`), and refresh it on launch
  - tapping a push opens `data.url`
  - add a push toggle to preferences
  - sign-out already removes devices on the server; the app clears local state too
- **Local reminders vs push:** the server now pushes the 24-hour and 1-hour reminders, so the local reminders from `reminder-plan.ts` would duplicate them. They need a clear rule (see the decisions below).
- **Offline tickets:**
  - sync `GET /api/registrations/tickets` on launch, on focus, and every `refreshAfter`
  - store the bundle per account, show "last synced", and drop revoked tickets
  - render the QR from the stored `token` when offline
  - clear the bundle on sign-out

**Open decisions:**

- What happens to local reminders when push is on: drop them, keep them only as an offline fallback, or let the user choose.
- Where to store tickets: SecureStore has per-value size limits, and up to 100 JWTs may not fit, so the choice is chunked SecureStore or an encrypted file.

**You need to:** create the FCM V1 credentials and upload them to EAS (Android push does not work without them), and add the APNs key when iOS builds start.

**Done when:**

- A push arrives and opens the right screen.
- A cancelled registration's ticket disappears on the next sync.
- Airplane mode still shows valid tickets.
- Signing in as another student shows none of the first student's tickets, reminders or devices.

## Phase 4: Store-readiness (end of the student release)

### Scope

- **Account deletion screen:** retype the email (`DELETE /api/users/me`). Show the 409 `errors.events` list for organizers who still own events. Sign out locally on success.
- **Report content:** a chat message, a review or an event, with a reason and details (`POST /api/reports`). Stores require this for apps with user-generated content.
- **Privacy and Support links** in Settings and on the auth screens (web `/privacy` and `/support`).
- **Native Google sign-in:** `POST /api/auth/google-native` with an ID token. Handle 401, 409 (an email/password account exists), 503 and 429. Needs the new dependency, a config plugin and a dev-client rebuild.
- An accessibility pass on real devices: labels, font scaling, contrast, reduced motion.

**Open decisions:** how to send the nonce for Google sign-in, and whether iOS ships now or later (it needs a Mac or an EAS build and an Apple account).

**You need to:** provide the Android and iOS OAuth client IDs, and add them to `GOOGLE_NATIVE_CLIENT_IDS` on the backend.

**Done when:** the student app is ready to submit to the stores.

## Phase 5: Role-aware app shell

### Scope

- **Auth gate:**
  - student → the student tabs
  - organizer → the organizer tabs
  - admin → `account-status` (web only)
- **Organizer tabs:** Manage, Browse, Notifications, Settings.
  - Manage lists owned events with drafts (`?organizerId=<me>&includeDrafts=true`) plus assigned events (`?staff=me`).
  - Browse is read-only, because only students register.
- **Student staff:** a "Staffing" section in My Events, shown only when `?staff=me` returns items.
- Event detail shows a tools area driven only by `permissions`.
- Organizer notification types (`new_registration`, `registration_cancelled`, `event_hidden`, `role_changed`).
- Sign-out and switching accounts between roles leave no cached state behind.

**Open decisions:** the organizer tab layout and naming, and what organizers see on event detail in place of Register.

**Done when:** each role lands in the right place, and a role change (made by an admin on the web) takes effect on the next session refresh.

## Phase 6: Door check-in

### Scope

- A per-event check-in screen with a scanner and an attendee list (`checkIn` and `attendees` permissions).
- **QR scan:** `POST /api/registrations/check-in { token }`. Clear results for:
  - 200, with the attendee's name
  - 409, already checked in
  - 400, invalid or expired ticket
  - 404, cancelled registration
  - 403, no permission
- A short cooldown between scans. The backend rate limit is 60/min.
- **Attendee search:** debounced and paginated (`GET /api/events/{id}/attendance?search=&page=&limit=`), with manual check-in by `registrationId`.
- **Live counts:** registered, checked in, turnout.
- **Explicit offline failure:** check-in needs the network. There is no silent queueing, and the screen says so.

**Open decisions:**

- The scanner library: `expo-camera` with its built-in barcode scanning is recommended and is an Expo module.
- Whether to add haptic and sound feedback (`expo-haptics`, another dependency).
- Whether to allow offline queued check-ins later (the backend has no batch endpoint today).

**You need to:** rebuild the dev client for the camera permission.

**Done when:** a volunteer, organizer or student staff member can check people in by scan and by search, a volunteer cannot edit the event, and every error case shows the right message.

## Phase 7: Organizer quick actions

### Scope

- **Publish a draft** (`POST /api/events/{id}/publish`): a one-way confirmation, with the 400 shown when the deadline has passed or the event is hidden.
- **Announcements** (`GET/POST /api/events/{id}/announcements`):
  - a composer with a `requestId` UUID that is reused on retry
  - a "N of 3 left today" counter and the 429 message
  - recent announcements
- **Chat moderation:** staff with `moderate` can delete messages. Staff with `chat` can post without registering.
- **Analytics summary** (`GET /api/analytics/organizer`): totals, the 30-day registration trend, events by status and category, and the top 5 events.
- "Edit on web" links for the work that stays on the web (create, edit, staff, collaborations, CSV export).

**Open decisions:** how charts are drawn: simple bars built from Views (no dependency, recommended), a chart library, or text plus numbers only.

**Done when:** an editor can publish and announce, a volunteer sees neither, and retrying an announcement never sends it twice.

---

## Later, only when a real need appears

- Organizer create, edit and duplicate event (image upload, time zones, map pin, partner colleges); staff management; collaboration invites.
- The attendance certificate, which is deferred on the backend.
- Universal or app links on a verified domain.
- Crash reporting with a reviewed data policy (ask before adding).
- Automated end-to-end student and organizer journeys against test accounts.
- Offline queued check-in (needs a backend batch endpoint).

## Web gaps found while planning (backend or web work, out of scope here)

1. `GET /api/events/{id}/staff` allows only the owner or an admin, so editors get a 403. Mobile will not show a staff list to editors.
2. The web event page renders `EventAnnouncements` and `EventStaff` twice, once gated by permissions and once by `canManageStaff`.
3. The web sidebar hides "Staff Events" from students, although students can be event staff.
4. `POST /api/collaborations` exists, but no web UI calls it.
