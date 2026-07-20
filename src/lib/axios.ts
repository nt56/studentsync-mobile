import { API_BASE_URL, CUSTOM_AUTH_ROUTES, ENDPOINTS } from "@/constants/api";
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { session } from "./session";

let onUnauthorized: (() => void) | null = null;

/** Wired up once by the auth gate so a 401 anywhere bounces to sign-in. */
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  // Render's free tier spins the backend down after inactivity; waking it back
  // up can take 20-50s, so a short timeout kills the very first request after
  // any idle period.
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

export function mayAttachCookie(url?: string): boolean {
  if (!url) return true;
  const path = url.split("?")[0];
  if (!path.startsWith("/api/auth/")) return true;
  return CUSTOM_AUTH_ROUTES.includes(path);
}

http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (mayAttachCookie(config.url)) {
    const cookie = await session.get();
    // React Native, unlike a browser, allows setting the Cookie header directly.
    if (cookie) config.headers.set("Cookie", cookie);
  }
  return config;
});

http.interceptors.response.use(
  async (response) => {
    // Pick up any refreshed session cookie. better-auth rotates the cookie on
    // `updateAge`, and POST /api/auth/profile forwards a fresh one after a
    // password change. saveFromSetCookie ignores the empty cookie-clearing value
    // that sign-out sends, so this can't wipe a good token.
    const setCookie = response.headers?.["set-cookie"] as
      string | string[] | undefined;
    if (setCookie) await session.saveFromSetCookie(setCookie);
    return response;
  },
  async (error: AxiosError) => {
    // A 401 from the login route means "wrong password", not "session expired" —
    // don't tear down a session over a failed sign-in attempt.
    const path = error.config?.url?.split("?")[0];
    const isLoginAttempt = path === ENDPOINTS.LOGIN;

    if (error.response?.status === 401 && !isLoginAttempt) {
      await session.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);
