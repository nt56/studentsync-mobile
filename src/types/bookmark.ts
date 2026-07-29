import type { EventCategory, EventStatus } from "./event";

export interface BookmarkedEvent {
  id: string;
  bookmarkId: string;
  title: string;
  description: string;
  date: string;
  venue: string;
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
