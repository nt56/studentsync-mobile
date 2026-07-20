import type { EventStatus } from "./event";

export interface Registration {
  id: string;
  eventId: string;
  studentId: string;
  registeredAt: string;
}

/**
 * GET /api/registrations items embed a SUBSET of the event under `event`.
 *
 * Careful: `event.status` here is the STORED Mongo field, not the computed one
 * that GET /api/events returns — it goes stale. Run it through
 * computeEventStatus() before rendering a badge.
 */
export interface RegistrationWithEvent extends Registration {
  event?: {
    id: string;
    title: string;
    date: string;
    venue: string;
    status: EventStatus;
    /** Not always present on this subset; needed to recompute status. */
    registrationDeadline?: string;
  };
}

export interface QrTicket {
  /** "data:image/png;base64,…" — render straight into <Image>. Encodes a 30-day JWT. */
  qrCode: string;
  checkedIn: boolean;
  registrationId: string;
}
