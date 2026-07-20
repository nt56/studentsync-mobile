export type EventStatus = "upcoming" | "closed" | "completed";

export type EventCategory =
  | "workshop"
  | "seminar"
  | "cultural"
  | "sports"
  | "technical"
  | "social"
  | "other";

export const EVENT_CATEGORIES: EventCategory[] = [
  "workshop",
  "seminar",
  "cultural",
  "sports",
  "technical",
  "social",
  "other",
];

export const EVENT_STATUSES: EventStatus[] = ["upcoming", "closed", "completed"];

/** Shape returned by GET /api/events and GET /api/events/:id (formatEventResponse). */
export interface EventResponse {
  id: string;
  title: string;
  description: string;
  /** ISO 8601 */
  date: string;
  venue: string;
  /** Plain id string — NOT populated. There is no organizer name in this payload. */
  organizerId: string;
  /** Plain id string — NOT populated. */
  collegeId: string;
  registrationDeadline: string;
  capacity: number;
  /** COMPUTED server-side from date/deadline (see lib/event-status.ts). */
  status: EventStatus;
  category: EventCategory;
  image?: string;
  latitude: number | null;
  longitude: number | null;
  /** 0 when there are no reviews. */
  averageRating: number;
  reviewCount: number;
  isInterCollege: boolean;
  partnerCollegeIds: string[];
  registrationCount?: number;
  /** Only present when the request carried a session cookie. */
  isRegistered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventQueryParams {
  page?: number;
  /** Server caps at 50. */
  limit?: number;
  status?: EventStatus;
  category?: EventCategory;
  collegeId?: string;
  /** Backed by a Mongo $text index on title+description — whole-word, not substring. */
  search?: string;
  sortBy?: "date" | "createdAt" | "title";
  sortOrder?: "asc" | "desc";
  isInterCollege?: boolean;
}
