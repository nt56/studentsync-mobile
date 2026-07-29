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
  dateOfBirth: string;
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
  requiresVerification: boolean;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  collegeId?: string;
  gender?: Gender;
  dateOfBirth?: string;
  profileImage?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
