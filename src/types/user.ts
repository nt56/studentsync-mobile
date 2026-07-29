import type { Gender, UserRole } from "./auth";

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  gender?: Gender;
  dateOfBirth?: string;
  phone?: string;
  bio?: string;
  profileImage?: string;
  collegeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeResponse extends UserResponse {
  college: { id: string; name: string } | null;
  stats: {
    registrationCount: number;
    organizedEventsCount: number;
    upcomingEventsCount: number;
  };
}

export interface StudentAnalytics {
  totalRegistrations: number;
  upcomingCount: number;
  completedCount: number;
  categoryDistribution: { category: string; count: number }[];
  registrationTimeline: { date: string; count: number }[];
}
