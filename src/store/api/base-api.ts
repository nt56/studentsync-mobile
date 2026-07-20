import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/base-query";

/**
 * One API slice; feature endpoints are attached with injectEndpoints() from the
 * files in this directory. The axios base query unwraps the backend's
 * { success, message, data } envelope, so endpoints see the payload directly.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery,
  tagTypes: [
    "Me",
    "Event",
    "Registration",
    "Review",
    "Notification",
    "Bookmark",
    "College",
    "Analytics",
  ],
  endpoints: () => ({}),
});
