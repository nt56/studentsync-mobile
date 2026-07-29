import { API_BASE_URL, CUSTOM_AUTH_ROUTES, ENDPOINTS } from "@/constants/api";
import { AxiosError, type InternalAxiosRequestConfig, create } from "axios";
import { session } from "./session";

let onUnauthorized: (() => void) | null = null;

/** Wired up once by the auth gate so a 401 anywhere bounces to sign-in. */
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export const http = create({
  baseURL: API_BASE_URL,
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
    if (cookie) config.headers.set("Cookie", cookie);
  }
  return config;
});

http.interceptors.response.use(
  async (response) => {
    const setCookie = response.headers?.["set-cookie"] as
      string | string[] | undefined;
    if (setCookie) await session.saveFromSetCookie(setCookie);
    return response;
  },
  async (error: AxiosError) => {
    const path = error.config?.url?.split("?")[0];
    const isLoginAttempt = path === ENDPOINTS.LOGIN;

    if (error.response?.status === 401 && !isLoginAttempt) {
      await session.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);
