import { ENDPOINTS } from "@/constants/api";
import type { Bookmark, BookmarkedEvent } from "@/types/bookmark";
import type { PaginatedResponse } from "@/types/common";
import { baseApi } from "./base-api";

export const BOOKMARKS_ARGS = { page: 1, limit: 50 } as const;

interface BookmarkPage extends PaginatedResponse<BookmarkedEvent> {
  bookmarkedEventIds: string[];
}

export const bookmarkApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBookmarks: build.query<BookmarkPage, { page?: number; limit?: number }>({
      query: (params) => ({ url: ENDPOINTS.BOOKMARKS, params }),
      providesTags: ["Bookmark"],
    }),

    getSavedEvents: build.infiniteQuery<BookmarkPage, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (page) =>
          page.pagination.hasMore ? page.pagination.page + 1 : undefined,
      },
      query: ({ pageParam }) => ({
        url: ENDPOINTS.BOOKMARKS,
        params: { page: pageParam, limit: 20 },
      }),
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
  useGetSavedEventsInfiniteQuery,
  useAddBookmarkMutation,
  useRemoveBookmarkMutation,
} = bookmarkApi;
