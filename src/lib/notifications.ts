import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { reminderPlan, type ReminderEvent } from "./reminder-plan";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = "event-reminders";

/** Android requires a channel to exist before notifications will display. */
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Event reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  // Simulators can't receive notifications.
  if (!Device.isDevice) return false;

  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** A stable id lets us cancel the reminder later without tracking anything. */
const reminderId = (eventId: string) => `event-reminder-${eventId}`;
let reminderWork: Promise<void> = Promise.resolve();

export function reconcileDeviceReminders(
  events: ReminderEvent[],
  enabled: boolean,
  isActive: () => boolean = () => true,
): Promise<void> {
  const work = reminderWork
    .catch(() => {})
    .then(async () => {
      if (!isActive() || Platform.OS === "web") return;
      const plan = enabled ? reminderPlan(events) : [];
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const desired = new Map(
        plan.map((event) => [reminderId(event.id), event]),
      );
      for (const entry of scheduled) {
        if (!isActive()) return;
        if (!entry.identifier.startsWith("event-reminder-")) continue;
        const event = desired.get(entry.identifier);
        if (
          event &&
          entry.content.data?.scheduledFor === event.date &&
          entry.content.data?.eventTitle === event.title
        ) {
          desired.delete(entry.identifier);
        } else {
          await Notifications.cancelScheduledNotificationAsync(
            entry.identifier,
          );
        }
      }
      if (!enabled || !(await Notifications.getPermissionsAsync()).granted)
        return;
      await ensureAndroidChannel();
      for (const event of desired.values()) {
        if (!isActive()) return;
        await Notifications.scheduleNotificationAsync({
          identifier: reminderId(event.id),
          content: {
            title: "Event tomorrow",
            body: `Don't miss "${event.title}".`,
            data: {
              eventId: event.id,
              scheduledFor: event.date,
              eventTitle: event.title,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(event.at),
            channelId: CHANNEL_ID,
          },
        });
      }
    });
  reminderWork = work;
  return work;
}

export function clearDeviceReminders() {
  return reconcileDeviceReminders([], false);
}

/** Schedules a nudge 24h before the event. No-op if that moment has passed. */
export async function scheduleEventReminder(
  eventId: string,
  title: string,
  eventDate: string | Date,
): Promise<void> {
  const when = new Date(new Date(eventDate).getTime() - 24 * 60 * 60 * 1000);
  if (when.getTime() <= Date.now()) return;

  if (!(await ensureNotificationPermission())) return;

  await Notifications.scheduleNotificationAsync({
    identifier: reminderId(eventId),
    content: {
      title: "Event tomorrow",
      body: `Don't miss "${title}".`,
      data: {
        eventId,
        scheduledFor: new Date(eventDate).toISOString(),
        eventTitle: title,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId(eventId));
  } catch {
    // Nothing was scheduled — fine.
  }
}
