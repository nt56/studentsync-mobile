import { ENDPOINTS } from "@/constants/api";
import type { NotificationFeed } from "@/types/notification";
import { baseApi } from "./base-api";

/**
 * The feed takes only `limit` (max 50) — it is NOT page-paginated. Keep this
 * constant: every useGetNotificationsQuery call and every updateQueryData patch
 * must use the identical arg or they'll address different cache entries.
 */
export const NOTIFICATIONS_LIMIT = 40;

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<NotificationFeed, number>({
      query: (limit) => ({
        url: ENDPOINTS.NOTIFICATIONS,
        params: { limit },
      }),
      providesTags: ["Notification"],
    }),

    /**
     * Optimistic: the badge should drop the instant you tap.
     * Virtual reminders (id starts with "vr_") are a server-side no-op, but they
     * still return 200, so treating them like any other notification is correct.
     */
    markRead: build.mutation<{ id: string; isRead: boolean }, string>({
      query: (id) => ({ url: ENDPOINTS.NOTIFICATION(id), method: "PATCH" }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          notificationApi.util.updateQueryData(
            "getNotifications",
            NOTIFICATIONS_LIMIT,
            (draft) => {
              const item = draft.items.find((n) => n.id === id);
              if (item && !item.isRead) {
                item.isRead = true;
                draft.unreadCount = Math.max(0, draft.unreadCount - 1);
              }
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    markAllRead: build.mutation<null, void>({
      query: () => ({ url: ENDPOINTS.NOTIFICATIONS_READ_ALL, method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          notificationApi.util.updateQueryData(
            "getNotifications",
            NOTIFICATIONS_LIMIT,
            (draft) => {
              draft.items.forEach((n) => {
                n.isRead = true;
              });
              draft.unreadCount = 0;
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    deleteNotification: build.mutation<null, string>({
      query: (id) => ({ url: ENDPOINTS.NOTIFICATION(id), method: "DELETE" }),
      invalidatesTags: ["Notification"],
    }),

    clearNotifications: build.mutation<null, void>({
      query: () => ({ url: ENDPOINTS.NOTIFICATIONS, method: "DELETE" }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useClearNotificationsMutation,
} = notificationApi;
