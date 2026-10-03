import { canRegister, computeEventStatus, eventEnd } from "@/lib/event-status";
import { formatEventTime } from "@/lib/event-time";
import { reminderPlan } from "@/lib/reminder-plan";

const date = "2026-10-10T10:00:00.000Z";
const endDate = "2026-10-10T18:00:00.000Z";
afterEach(() => jest.useRealTimers());

it("closes at the start and completes only at the end", () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(date));
  expect(computeEventStatus({ date, endDate })).toBe("closed");
  expect(
    canRegister({
      date,
      status: "upcoming",
      registrationDeadline: endDate,
      capacity: 10,
    }),
  ).toBe(false);
  jest.setSystemTime(new Date(endDate));
  expect(computeEventStatus({ date, endDate })).toBe("completed");
});

it("uses the actual calendar end and the legacy two-hour fallback", () => {
  expect(eventEnd({ date, endDate }).toISOString()).toBe(endDate);
  expect(eventEnd({ date }).toISOString()).toBe("2026-10-10T12:00:00.000Z");
});

it("renders event time in the event's time zone", () => {
  expect(formatEventTime(date, "Asia/Kolkata")).toMatch(/3:30|15:30/);
  expect(formatEventTime("invalid", "Asia/Kolkata")).toBe("Date unavailable");
  expect(() => formatEventTime(date, "invalid-zone")).not.toThrow();
});

it("only schedules future reminders and deduplicates registrations", () => {
  const events = [
    { id: "same", title: "Old title", date },
    { id: "same", title: "Updated title", date: endDate },
    { id: "past", title: "Past", date: "2026-10-01T10:00:00.000Z" },
    { id: "invalid", title: "Invalid", date: "bad date" },
  ];
  const result = reminderPlan(events, Date.parse("2026-10-08T10:00:00.000Z"));
  expect(result).toEqual([
    {
      id: "same",
      title: "Updated title",
      date: endDate,
      at: Date.parse(endDate) - 86400000,
    },
  ]);
});
