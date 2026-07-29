import { ENDPOINTS } from "@/constants/api";
import type { Bookmark, BookmarkedEvent } from "@/types/bookmark";
import type { PaginatedResponse } from "@/types/common";
import { baseApi } from "./base-api";

export const BOOKMARKS_ARGS = { page: 1, limit: 50 } as const;

export const bookmarkApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBookmarks: build.query<
      PaginatedResponse<BookmarkedEvent>,
      { page?: number; limit?: number }
    >({
      query: (params) => ({ url: ENDPOINTS.BOOKMARKS, params }),
      providesTags: ["Bookmark"],
    }),

    addBookmark: build.mutation<Bookmark, string>({
      query: (eventId) => ({
        url: ENDPOINTS.BOOKMARKS,
        method: "POST",
        data: { eventId },
      }),
      invalidatesTags: ["Bookmark"],
    }),

    removeBookmark: build.mutation<null, string>({
      query: (eventId) => ({
        url: ENDPOINTS.BOOKMARK(eventId),
        method: "DELETE",
      }),
      invalidatesTags: ["Bookmark"],
    }),
  }),
});

export const {
  useGetBookmarksQuery,
  useAddBookmarkMutation,
  useRemoveBookmarkMutation,
} = bookmarkApi;
