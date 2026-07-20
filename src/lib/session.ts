import * as SecureStore from "expo-secure-store";

const COOKIE_KEY = "ba_session_cookie";

/**
 * Better Auth names the session cookie `better-auth.session_token`, and prefixes
 * it with `__Secure-` whenever baseURL is https (i.e. always in production).
 *
 * React Native may join multiple Set-Cookie headers into one comma-separated
 * string, so the value must stop at `;`, `,` or whitespace.
 */
const TOKEN_RE = /(?:__Secure-)?better-auth\.session_token=[^;,\s]+/;

/**
 * We deliberately do NOT persist `better-auth.session_data`.
 *
 * That second cookie is better-auth's 5-minute session cache. We have no way to
 * keep it fresh, so replaying a copy captured at login for the whole 7-day
 * session life would either be ignored (dead weight) or serve stale identity
 * data. Omitting it simply makes the server do a real session lookup, which is
 * both correct and cheaper to reason about.
 */
export const session = {
  /**
   * Extract and persist the session cookie from a login/register response.
   * Returns false when no usable token was present (e.g. a sign-out response,
   * which clears the cookie by sending an empty value).
   */
  async saveFromSetCookie(
    setCookie?: string | string[] | null,
  ): Promise<boolean> {
    if (!setCookie) return false;
    const raw = Array.isArray(setCookie) ? setCookie.join(",") : setCookie;

    const match = raw.match(TOKEN_RE)?.[0];
    if (!match) return false;

    // Guard against the cookie-clearing form (`…session_token=""`).
    const value = match.slice(match.indexOf("=") + 1);
    if (!value || value === '""') return false;

    await SecureStore.setItemAsync(COOKIE_KEY, match);
    return true;
  },

  get(): Promise<string | null> {
    return SecureStore.getItemAsync(COOKIE_KEY);
  },

  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(COOKIE_KEY);
  },
};
