import { API_BASE_URL, ENDPOINTS } from "@/constants/api";
import type { PaginatedResponse } from "@/types/common";
import type { EventQueryParams, EventResponse } from "@/types/event";
import { baseApi } from "./base-api";

export const EVENTS_PAGE_SIZE = 10;

export const eventApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEvents: build.infiniteQuery<
      PaginatedResponse<EventResponse>,
      EventQueryParams,
      number
    >({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
          lastPage.pagination.hasMore
            ? lastPage.pagination.page + 1
            : undefined,
      },
      query: ({ queryArg, pageParam }) => ({
        url: ENDPOINTS.EVENTS,
        params: {
          ...queryArg,
          page: pageParam,
          limit: queryArg.limit ?? EVENTS_PAGE_SIZE,
        },
      }),
      providesTags: [{ type: "Event", id: "LIST" }],
    }),

    getEvent: build.query<EventResponse, string>({
      query: (id) => ({ url: ENDPOINTS.EVENT(id) }),
      providesTags: (_result, _error, id) => [{ type: "Event", id }],
    }),
  }),
});

export function eventIcsUrl(id: string): string {
  return `${API_BASE_URL}${ENDPOINTS.EVENT_ICS(id)}`;
}

/** The backend also serves the public web pages, so this is a shareable deep link. */
export function eventWebUrl(id: string): string {
  return `${API_BASE_URL}/events/${id}`;
}

export const { useGetEventsInfiniteQuery, useGetEventQuery } = eventApi;
