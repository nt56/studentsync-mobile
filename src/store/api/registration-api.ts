import { ENDPOINTS } from "@/constants/api";
import type { PaginatedResponse } from "@/types/common";
import type {
  QrTicket,
  Registration,
  RegistrationWithEvent,
} from "@/types/registration";
import { baseApi } from "./base-api";

export const REGISTRATIONS_ARGS = { page: 1, limit: 50 } as const;

export const registrationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyRegistrations: build.query<
      PaginatedResponse<RegistrationWithEvent>,
      { page?: number; limit?: number }
    >({
      query: (params) => ({ url: ENDPOINTS.REGISTRATIONS, params }),
      providesTags: [{ type: "Registration", id: "LIST" }],
    }),

    getRegistrationPages: build.infiniteQuery<
      PaginatedResponse<RegistrationWithEvent>,
      void,
      number
    >({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (page) =>
          page.pagination.hasMore ? page.pagination.page + 1 : undefined,
      },
      query: ({ pageParam }) => ({
        url: ENDPOINTS.REGISTRATIONS,
        params: { page: pageParam, limit: 20 },
      }),
      providesTags: [{ type: "Registration", id: "LIST" }],
    }),

    getReminderRegistrations: build.query<RegistrationWithEvent[], void>({
      async queryFn(_arg, _api, _options, baseQuery) {
        const items: RegistrationWithEvent[] = [];
        let page = 1;
        while (true) {
          const result = await baseQuery({
            url: ENDPOINTS.REGISTRATIONS,
            params: { page, limit: 100 },
          });
          if (result.error) return { error: result.error };
          const data = result.data as PaginatedResponse<RegistrationWithEvent>;
          items.push(...data.items);
          if (!data.pagination.hasMore) return { data: items };
          page += 1;
        }
      },
      providesTags: [{ type: "Registration", id: "LIST" }],
    }),

    registerForEvent: build.mutation<Registration, string>({
      query: (eventId) => ({
        url: ENDPOINTS.REGISTRATIONS,
        method: "POST",
        data: { eventId },
      }),
      invalidatesTags: (_result, _error, eventId) => [
        { type: "Event", id: eventId },
        { type: "Event", id: "LIST" },
        { type: "Registration", id: "LIST" },
        "Analytics",
        "Me",
        "Notification",
      ],
    }),

    cancelRegistration: build.mutation<null, string>({
      query: (eventId) => ({
        url: ENDPOINTS.REGISTRATIONS,
        method: "DELETE",
        params: { eventId },
      }),
      invalidatesTags: (_result, _error, eventId) => [
        { type: "Event", id: eventId },
        { type: "Event", id: "LIST" },
        { type: "Registration", id: "LIST" },
        "Analytics",
        "Me",
        "Notification",
      ],
    }),

    getQrTicket: build.query<QrTicket, string>({
      query: (registrationId) => ({
        url: ENDPOINTS.REGISTRATION_QR(registrationId),
      }),
      providesTags: (_result, _error, id) => [
        { type: "Registration", id },
        { type: "Registration", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetMyRegistrationsQuery,
  useGetRegistrationPagesInfiniteQuery,
  useGetReminderRegistrationsQuery,
  useRegisterForEventMutation,
  useCancelRegistrationMutation,
  useGetQrTicketQuery,
} = registrationApi;
