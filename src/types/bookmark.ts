import type { EventCategory, EventStatus } from "./event";

export interface BookmarkedEvent {
  /** The event id. */
  id: string;
  /** The bookmark document id. Use it as the list key. */
  bookmarkId: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  /** STORED status — stale. Do not render directly. */
  status: EventStatus;
  category: EventCategory;
  image?: string;
  capacity: number;
  registrationDeadline: string;
  averageRating: number;
  reviewCount: number;
  isInterCollege: boolean;
  collegeId?: { _id: string; name: string } | string;
  organizerId?: { _id: string; firstName: string; lastName: string } | string;
}

export interface Bookmark {
  id: string;
  eventId: string;
  createdAt: string;
}
