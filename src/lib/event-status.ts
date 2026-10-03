import type { EventStatus } from "@/types/event";

interface EventSchedule {
  date: string | Date;
  endDate?: string | Date;
  registrationDeadline?: string | Date;
}

export function eventEnd(event: EventSchedule): Date {
  return event.endDate
    ? new Date(event.endDate)
    : new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000);
}

export function computeEventStatus(event: EventSchedule): EventStatus {
  const now = Date.now();
  if (now >= eventEnd(event).getTime()) return "completed";
  if (now >= new Date(event.date).getTime()) return "closed";
  if (
    event.registrationDeadline &&
    now > new Date(event.registrationDeadline).getTime()
  ) {
    return "closed";
  }
  return "upcoming";
}

export function reconcileStoredStatus(
  event: EventSchedule & { status: EventStatus },
): EventStatus {
  if (event.endDate) return computeEventStatus(event);
  return event.status;
}

export function canRegister(event: {
  status: EventStatus;
  date?: string | Date;
  registrationDeadline: string | Date;
  capacity: number;
  registrationCount?: number;
}): boolean {
  if (event.status !== "upcoming") return false;
  if (event.date && Date.now() >= new Date(event.date).getTime()) return false;
  if (Date.now() > new Date(event.registrationDeadline).getTime()) return false;
  return (event.registrationCount ?? 0) < event.capacity;
}
