import { ENDPOINTS } from "@/constants/api";
import type { PaginatedResponse } from "@/types/common";
import type {
  QrTicket,
  Registration,
  RegistrationWithEvent,
} from "@/types/registration";
import { baseApi } from "./base-api";

/** Keep this stable — it's the cache key for the My Events list. */
export const REGISTRATIONS_ARGS = { page: 1, limit: 50 } as const;

export const registrationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyRegistrations: build.query<
      PaginatedResponse<RegistrationWithEvent>,
      { page?: number; limit?: number }
    >({
      // No eventId param => "my registrations".
      query: (params) => ({ url: ENDPOINTS.REGISTRATIONS, params }),
      providesTags: [{ type: "Registration", id: "LIST" }],
    }),

    registerForEvent: build.mutation<Registration, string>({
      query: (eventId) => ({
        url: ENDPOINTS.REGISTRATIONS,
        method: "POST",
        data: { eventId },
      }),
      // Registering changes isRegistered + registrationCount on the event, the
      // My Events list, the profile stat counters and the analytics dashboard.
      invalidatesTags: (_result, _error, eventId) => [
        { type: "Event", id: eventId },
        { type: "Event", id: "LIST" },
        { type: "Registration", id: "LIST" },
        "Analytics",
        "Me",
      ],
    }),

    cancelRegistration: build.mutation<null, string>({
      query: (eventId) => ({
        url: ENDPOINTS.REGISTRATIONS,
        method: "DELETE",
        // eventId goes in the QUERY STRING here, not the body and not the path.
        params: { eventId },
      }),
      invalidatesTags: (_result, _error, eventId) => [
        { type: "Event", id: eventId },
        { type: "Event", id: "LIST" },
        { type: "Registration", id: "LIST" },
        "Analytics",
        "Me",
      ],
    }),

    /** The QR encodes a signed 30-day JWT; an organizer scans it to check you in. */
    getQrTicket: build.query<QrTicket, string>({
      query: (registrationId) => ({
        url: ENDPOINTS.REGISTRATION_QR(registrationId),
      }),
      providesTags: (_result, _error, id) => [{ type: "Registration", id }],
    }),
  }),
});

export const {
  useGetMyRegistrationsQuery,
  useRegisterForEventMutation,
  useCancelRegistrationMutation,
  useGetQrTicketQuery,
} = registrationApi;
