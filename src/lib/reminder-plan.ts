export interface ReminderEvent {
  id: string;
  title: string;
  date: string;
}

export function reminderPlan(events: ReminderEvent[], now = Date.now()) {
  return [...new Map(events.map((event) => [event.id, event])).values()]
    .map((event) => ({
      ...event,
      at: Date.parse(event.date) - 24 * 60 * 60 * 1000,
    }))
    .filter((event) => Number.isFinite(event.at) && event.at > now)
    .sort((a, b) => a.at - b.at)
    .slice(0, 32);
}
