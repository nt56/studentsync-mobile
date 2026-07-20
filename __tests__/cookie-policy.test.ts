import { mayAttachCookie } from "@/lib/axios";

/**
 * The rule this guards is the single subtlest thing in the app.
 *
 * better-auth's catch-all route runs an origin check that rejects any non-GET
 * request carrying a Cookie header but NO Origin header — and React Native never
 * sends Origin. So attaching the session cookie to a catch-all endpoint produces
 * a 403 "Missing or null Origin header" that looks nothing like its cause.
 *
 * The four CUSTOM auth routes are Next.js handlers that call auth.api.*
 * server-side without a `request` object, so the check never runs on them.
 */
describe("mayAttachCookie", () => {
  it("attaches the cookie to ordinary API routes", () => {
    expect(mayAttachCookie("/api/events")).toBe(true);
    expect(mayAttachCookie("/api/users/me")).toBe(true);
    expect(mayAttachCookie("/api/registrations")).toBe(true);
    expect(mayAttachCookie("/api/bookmarks/abc123")).toBe(true);
    expect(mayAttachCookie("/api/notifications")).toBe(true);
  });

  it("attaches the cookie to the four custom auth routes", () => {
    expect(mayAttachCookie("/api/auth/register")).toBe(true);
    expect(mayAttachCookie("/api/auth/login")).toBe(true);
    expect(mayAttachCookie("/api/auth/sign-out")).toBe(true);
    expect(mayAttachCookie("/api/auth/profile")).toBe(true);
  });

  it("WITHHOLDS the cookie from better-auth catch-all routes", () => {
    // These are the ones that would 403. They're public endpoints anyway, so
    // withholding the session token is also correct least-privilege behaviour.
    expect(mayAttachCookie("/api/auth/request-password-reset")).toBe(false);
    expect(mayAttachCookie("/api/auth/reset-password")).toBe(false);
    expect(mayAttachCookie("/api/auth/send-verification-email")).toBe(false);
    expect(mayAttachCookie("/api/auth/verify-email")).toBe(false);
    expect(mayAttachCookie("/api/auth/get-session")).toBe(false);
    expect(mayAttachCookie("/api/auth/sign-in/email")).toBe(false);
  });

  it("ignores the query string when deciding", () => {
    expect(mayAttachCookie("/api/auth/verify-email?token=abc")).toBe(false);
    expect(mayAttachCookie("/api/registrations?eventId=abc")).toBe(true);
  });

  it("does not confuse /api/auth/profile with a catch-all sub-path", () => {
    expect(mayAttachCookie("/api/auth/profile")).toBe(true);
    // A deeper path under /api/auth/ is NOT one of the four custom routes.
    expect(mayAttachCookie("/api/auth/profile/something-else")).toBe(false);
  });
});
