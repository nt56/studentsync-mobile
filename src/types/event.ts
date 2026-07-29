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

export const EVENT_STATUSES: EventStatus[] = [
  "upcoming",
  "closed",
  "completed",
];

export interface EventResponse {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  organizerId: string;
  collegeId: string;
  registrationDeadline: string;
  capacity: number;
  status: EventStatus;
  category: EventCategory;
  image?: string;
  latitude: number | null;
  longitude: number | null;
  averageRating: number;
  reviewCount: number;
  isInterCollege: boolean;
  partnerCollegeIds: string[];
  registrationCount?: number;
  isRegistered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  status?: EventStatus;
  category?: EventCategory;
  collegeId?: string;
  search?: string;
  sortBy?: "date" | "createdAt" | "title";
  sortOrder?: "asc" | "desc";
  isInterCollege?: boolean;
}
