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
      ],
    }),

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
