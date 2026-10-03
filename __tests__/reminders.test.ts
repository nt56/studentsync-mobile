import * as Notifications from "expo-notifications";
import { reconcileDeviceReminders } from "@/lib/notifications";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

const scheduled = Notifications.getAllScheduledNotificationsAsync as jest.Mock;
const cancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const permission = Notifications.getPermissionsAsync as jest.Mock;
const event = {
  id: "event1",
  title: "Campus workshop",
  date: "2030-10-10T10:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  scheduled.mockResolvedValue([]);
  permission.mockResolvedValue({ granted: true });
});

it("cancels old registrations and reschedules changed events", async () => {
  scheduled.mockResolvedValue([
    {
      identifier: "event-reminder-event1",
      content: { data: { scheduledFor: "2030-10-09T10:00:00.000Z" } },
    },
    { identifier: "event-reminder-cancelled", content: { data: {} } },
  ]);
  await reconcileDeviceReminders([event], true);
  expect(cancel).toHaveBeenCalledTimes(2);
  expect(schedule).toHaveBeenCalledWith(
    expect.objectContaining({
      identifier: "event-reminder-event1",
      trigger: expect.objectContaining({
        date: new Date("2030-10-09T10:00:00.000Z"),
      }),
    }),
  );
});

it("does not duplicate an unchanged reminder", async () => {
  scheduled.mockResolvedValue([
    {
      identifier: "event-reminder-event1",
      content: { data: { scheduledFor: event.date, eventTitle: event.title } },
    },
  ]);
  await reconcileDeviceReminders([event], true);
  expect(cancel).not.toHaveBeenCalled();
  expect(schedule).not.toHaveBeenCalled();
});

it("removes reminders when the preference is disabled", async () => {
  scheduled.mockResolvedValue([
    { identifier: "event-reminder-event1", content: { data: {} } },
  ]);
  await reconcileDeviceReminders([event], false);
  expect(cancel).toHaveBeenCalledWith("event-reminder-event1");
  expect(schedule).not.toHaveBeenCalled();
});

it("does not schedule without permission or after the session unmounts", async () => {
  permission.mockResolvedValue({ granted: false });
  await reconcileDeviceReminders([event], true);
  expect(schedule).not.toHaveBeenCalled();
  await reconcileDeviceReminders([event], true, () => false);
  expect(scheduled).toHaveBeenCalledTimes(1);
});
