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
  /** Plain id string. The human-readable name lives on MeResponse.college. */
  collegeId?: string;
  createdAt: string;
  updatedAt: string;
}

/** GET /api/users/me — UserResponse plus a populated college and stats. */
export interface MeResponse extends UserResponse {
  college: { id: string; name: string } | null;
  stats: {
    registrationCount: number;
    /** Always 0 for students. */
    organizedEventsCount: number;
    upcomingEventsCount: number;
  };
}

/** GET /api/analytics/student */
export interface StudentAnalytics {
  totalRegistrations: number;
  upcomingCount: number;
  completedCount: number;
  categoryDistribution: { category: string; count: number }[];
  /** 30 entries, oldest -> newest. */
  registrationTimeline: { date: string; count: number }[];
}
