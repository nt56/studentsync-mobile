# Next phase

## Student improvements first

| Priority | Feature                            | Dependency and completion check                                                                                                                |
| -------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Offline tickets                    | Backend-defined token expiry/revocation policy; encrypted per-account storage; show last refresh and clear on sign-out                         |
| 2        | Remote push                        | Device-token registration, per-user authorization, durable delivery and receipts; cancelled/rescheduled events cannot send stale alerts        |
| 3        | Native Google sign-in              | Native callback trust and secure session handoff in Better Auth; exercise cancellation, existing accounts, verification, and account switching |
| 4        | Waitlists                          | Transactional backend queue and seat offers; two students cannot accept the same seat                                                          |
| 5        | Calendar subscriptions             | Private revocable calendar feed reflecting registrations and schedule changes                                                                  |
| 6        | Certificates                       | Backend verifies check-in before issuing a downloadable certificate                                                                            |
| 7        | Saved searches and recommendations | Explicit interests/college filters and explainable matching; respect notification preferences                                                  |
| 8        | Registration questions and teams   | Versioned questions, team membership rules, and server-side capacity enforcement                                                               |

Before public release, prioritize account deletion, privacy/support links, real-device accessibility checks, and automated end-to-end student journeys. Add crash reporting with a reviewed data policy and environment-specific configuration.

## Organizer mobile

Introduce a separate role-specific route group after the student release is verified. Reuse API modules and UI components; keep server authorization authoritative.

Start with assigned/owned events, attendee search, QR scanning, attendance counts, and explicit offline failure handling. Then add event drafts, editing, schedule/capacity changes, images, staff permissions, announcements, and analytics. Student staff assignments must be checked per event rather than treated as a global organizer role.

## Admin mobile

Add a separate admin route group for verified admin accounts. Start with moderation queues, users/colleges, and audit history. Role changes, deletions, and global settings need explicit confirmation, permission checks, and traceability. Keep complex configuration on the web until there is a clear mobile use case.

## Engineering work

- Share or generate response schemas from the backend, including pagination, event permissions, schedule fields, and errors.
- Add test-account end-to-end journeys without touching production data or sending real email.
- Extend chat pagination to a `(createdAt, id)` cursor before relying on history under high concurrent message volume.
- Introduce notification pagination beyond the current latest-50 API.
- Replace per-ticket event-detail requests with richer registration summaries if list traffic becomes significant.
- Add universal/app links using a verified owned domain and backend association files; retain web links until configured.
