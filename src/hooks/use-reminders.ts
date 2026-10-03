import {
  reconcileDeviceReminders,
  clearDeviceReminders,
} from "@/lib/notifications";
import { useGetPreferencesQuery } from "@/store/api/preferences-api";
import { useGetReminderRegistrationsQuery } from "@/store/api/registration-api";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export function useReminders() {
  const router = useRouter();
  const { data: preferences } = useGetPreferencesQuery(undefined, {
    pollingInterval: 60_000,
    skipPollingIfUnfocused: true,
  });
  const { data } = useGetReminderRegistrationsQuery(undefined, {
    skip: !preferences?.reminders,
    pollingInterval: 60_000,
    skipPollingIfUnfocused: true,
  });

  useEffect(() => {
    if (!preferences || (preferences.reminders && !data)) return;
    let active = true;
    const events = (data ?? []).flatMap((registration) =>
      registration.event ? [registration.event] : [],
    );
    void reconcileDeviceReminders(
      events,
      preferences.reminders,
      () => active,
    ).catch(() => {});
    return () => {
      active = false;
    };
  }, [preferences, data]);

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      const id = response?.notification.request.content.data?.eventId;
      if (typeof id === "string" && /^[a-f\d]{24}$/i.test(id)) {
        router.push({ pathname: "/events/[id]", params: { id } });
        void Notifications.clearLastNotificationResponseAsync();
      }
    };
    void Notifications.getLastNotificationResponseAsync()
      .then(open)
      .catch(() => {});
    const subscription =
      Notifications.addNotificationResponseReceivedListener(open);
    return () => {
      subscription.remove();
      void clearDeviceReminders().catch(() => {});
    };
  }, [router]);
}
