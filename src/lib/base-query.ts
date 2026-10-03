import type { ApiError } from "@/types/common";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { http } from "./axios";

export interface BaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig["method"];
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  raw?: boolean;
}

export function toApiError(err: unknown): ApiError {
  const e = err as AxiosError<{
    message?: string;
    errors?: Record<string, string[]> | null;
  }>;
  return {
    status: e.response?.status ?? 0,
    message:
      e.response?.data?.message ??
      e.message ??
      "Something went wrong. Please try again.",
    fieldErrors: e.response?.data?.errors ?? null,
  };
}

export const axiosBaseQuery: BaseQueryFn<
  BaseQueryArgs,
  unknown,
  ApiError
> = async ({ url, method = "GET", data, params, headers, raw }, api) => {
  try {
    const res = await http.request({
      url,
      method,
      data,
      params,
      headers,
      signal: api.signal,
    });
    return { data: raw ? res.data : res.data?.data };
  } catch (err) {
    return { error: toApiError(err) };
  }
};

export function apiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!err) return fallback;
  const e = err as Partial<ApiError> & { message?: string };
  return e.message || fallback;
}

/** Field-level validation errors, keyed by field path. */
export function apiFieldErrors(err: unknown): Record<string, string[]> | null {
  return (err as Partial<ApiError> | undefined)?.fieldErrors ?? null;
}
