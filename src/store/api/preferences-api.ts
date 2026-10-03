import { ENDPOINTS } from "@/constants/api";
import { baseApi } from "./base-api";

export interface NotificationPreferences {
  reminders: boolean;
  email: boolean;
}

export const preferencesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPreferences: build.query<NotificationPreferences, void>({
      query: () => ({ url: ENDPOINTS.PREFERENCES }),
      providesTags: ["Preferences"],
    }),
    updatePreferences: build.mutation<
      NotificationPreferences,
      NotificationPreferences
    >({
      query: (data) => ({ url: ENDPOINTS.PREFERENCES, method: "PUT", data }),
      invalidatesTags: ["Preferences", "Notification"],
    }),
  }),
});

export const { useGetPreferencesQuery, useUpdatePreferencesMutation } =
  preferencesApi;
