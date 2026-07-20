export type UserRole = "student" | "organizer" | "admin";
export type Gender = "male" | "female" | "other" | "prefer-not-to-say";

export const GENDERS: Gender[] = [
  "male",
  "female",
  "other",
  "prefer-not-to-say",
];

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: Gender;
  /** Register accepts a plain `YYYY-MM-DD`. (PATCH /profile does NOT — see UpdateProfileInput.) */
  dateOfBirth: string;
  /** REQUIRED. 10-15 digits once non-digits are stripped. */
  phone: string;
  collegeId?: string;
}

export interface SignInInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpResult {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  /**
   * True when the server enforced email verification — in which case it sent NO
   * Set-Cookie and the user is not signed in. They must verify before logging in.
   */
  requiresVerification: boolean;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  /** '' unsets the college. */
  collegeId?: string;
  gender?: Gender;
  /** MUST be a strict ISO-8601 datetime here (z.string().datetime()) — unlike register. */
  dateOfBirth?: string;
  /** MUST be a valid URL (z.string().url()) — pass the Cloudinary `filePath` from /api/upload. */
  profileImage?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
