import { axiosBaseQuery } from "@/lib/base-query";
import { createApi } from "@reduxjs/toolkit/query/react";

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
