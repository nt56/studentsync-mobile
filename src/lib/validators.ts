import { LIMITS } from "@/constants/api";
import { z } from "zod";

function phoneDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

function isValidPhone(value: string): boolean {
  const n = phoneDigits(value);
  return n >= 10 && n <= 15;
}

/** Server regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, min 8, max 100. No symbol required. */
const passwordField = z
  .string()
  .min(8, "At least 8 characters")
  .max(100, "At most 100 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/\d/, "Add a number");

/** The server rejects anyone under 16. */
function isAtLeast16(value: string): boolean {
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return false;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 16);
  return dob <= cutoff;
}

const genderField = z.enum(["male", "female", "other", "prefer-not-to-say"]);

// ---------------------------------------------------------------- auth forms

export const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type SignInForm = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "At least 2 characters")
      .max(50, "At most 50 characters"),
    lastName: z
      .string()
      .trim()
      .min(2, "At least 2 characters")
      .max(50, "At most 50 characters"),
    email: z.email("Enter a valid email address"),
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
    gender: genderField,
    // Register accepts a plain YYYY-MM-DD. (PATCH /profile does not — see below.)
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine(isAtLeast16, "You must be at least 16 years old"),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .refine(isValidPhone, "Enter 10-15 digits"),
    collegeId: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignUpForm = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
});
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  // The server enforces this too — don't let the user discover it via a 400.
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from your current one",
    path: ["newPassword"],
  });
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// ------------------------------------------------------------- profile form

/** Every field is optional server-side; "" on collegeId unsets it. */
export const editProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(50, "At most 50 characters"),
  lastName: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(50, "At most 50 characters"),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidPhone(v), "Enter 10-15 digits"),
  bio: z.string().max(LIMITS.BIO, `At most ${LIMITS.BIO} characters`),
  gender: genderField.optional(),
  dateOfBirth: z
    .string()
    .refine(
      (v) => v === "" || isAtLeast16(v),
      "You must be at least 16 years old",
    ),
  collegeId: z.string(),
});
export type EditProfileForm = z.infer<typeof editProfileSchema>;

// -------------------------------------------------------------- review form

export const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Pick a rating")
    .max(5, "Pick a rating between 1 and 5"),
  comment: z
    .string()
    .max(LIMITS.REVIEW_COMMENT, `At most ${LIMITS.REVIEW_COMMENT} characters`),
});
export type ReviewForm = z.infer<typeof reviewSchema>;
