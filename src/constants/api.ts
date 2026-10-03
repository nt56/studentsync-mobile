/**
 * Expo inlines EXPO_PUBLIC_* at build time, so this is a literal in the bundle.
 * It must point at the origin running the custom server.ts (the Socket.IO host),
 * not a separate static deployment — otherwise chat will never connect.
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(
  /\/$/,
  "",
);

/** The backend mounts Socket.IO here (server.ts: `path: "/api/socket"`). */
export const SOCKET_PATH = "/api/socket";

export const ENDPOINTS = {
  // --- Custom auth routes (Next.js route handlers wrapping better-auth). -----
  // These call auth.api.* server-side with no `request` object, so better-auth's
  // origin check never runs on them. They are safe to send a Cookie header to.
  REGISTER: "/api/auth/register",
  LOGIN: "/api/auth/login",
  SIGN_OUT: "/api/auth/sign-out",
  PROFILE: "/api/auth/profile",

  // --- better-auth CATCH-ALL routes (/api/auth/[...all]). -------------------
  // DANGER: these run better-auth's originCheckMiddleware. A non-GET request
  // carrying a Cookie header but no Origin header is rejected with
  // 403 "Missing or null Origin header" — and React Native never sends Origin.
  // lib/axios.ts therefore withholds the cookie from anything under /api/auth/
  // that is not one of the four custom routes above.
  REQUEST_PASSWORD_RESET: "/api/auth/request-password-reset",
  RESET_PASSWORD: "/api/auth/reset-password",
  SEND_VERIFICATION_EMAIL: "/api/auth/send-verification-email",

  ME: "/api/users/me",
  PREFERENCES: "/api/users/preferences",

  EVENTS: "/api/events",
  EVENT: (id: string) => `/api/events/${id}`,
  EVENT_ICS: (id: string) => `/api/events/${id}/ics`,
  EVENT_REVIEWS: (id: string) => `/api/events/${id}/reviews`,
  EVENT_MESSAGES: (id: string) => `/api/events/${id}/messages`,
  REVIEW: (reviewId: string) => `/api/reviews/${reviewId}`,

  REGISTRATIONS: "/api/registrations",
  REGISTRATION_QR: (id: string) => `/api/registrations/${id}/qr`,

  BOOKMARKS: "/api/bookmarks",
  /** Keyed by EVENT id in the path — not the bookmark id. */
  BOOKMARK: (eventId: string) => `/api/bookmarks/${eventId}`,

  NOTIFICATIONS: "/api/notifications",
  NOTIFICATION: (id: string) => `/api/notifications/${id}`,
  NOTIFICATIONS_READ_ALL: "/api/notifications/mark-all-read",

  COLLEGES: "/api/colleges",
  ANALYTICS_STUDENT: "/api/analytics/student",
  UPLOAD: "/api/upload",
} as const;

/**
 * The four custom auth routes. Everything else under /api/auth/ falls through to
 * better-auth's catch-all and must NOT receive a Cookie header. See lib/axios.ts.
 */
export const CUSTOM_AUTH_ROUTES: readonly string[] = [
  ENDPOINTS.REGISTER,
  ENDPOINTS.LOGIN,
  ENDPOINTS.SIGN_OUT,
  ENDPOINTS.PROFILE,
];

export const LIMITS = {
  EVENTS: 50,
  REGISTRATIONS: 100,
  NOTIFICATIONS: 50,
  BOOKMARKS: 50,
  COLLEGES: 100,
  CHAT_MESSAGES: 100,
  MESSAGE_LENGTH: 1000,
  REVIEW_COMMENT: 500,
  BIO: 500,
  UPLOAD_BYTES: 5 * 1024 * 1024,
} as const;

export const UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
