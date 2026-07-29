import * as SecureStore from "expo-secure-store";

const COOKIE_KEY = "ba_session_cookie";

const TOKEN_RE = /(?:__Secure-)?better-auth\.session_token=[^;,\s]+/;

export const session = {
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
