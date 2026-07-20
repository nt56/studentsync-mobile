import type { EventStatus } from "@/types/event";

export function computeEventStatus(event: {
  date: string | Date;
  registrationDeadline?: string | Date;
}): EventStatus {
  const now = Date.now();
  if (now > new Date(event.date).getTime()) return "completed";
  if (
    event.registrationDeadline &&
    now > new Date(event.registrationDeadline).getTime()
  ) {
    return "closed";
  }
  return "upcoming";
}

export function reconcileStoredStatus(event: {
  date: string | Date;
  status: EventStatus;
}): EventStatus {
  if (Date.now() > new Date(event.date).getTime()) return "completed";
  return event.status;
}

export function canRegister(event: {
  status: EventStatus;
  registrationDeadline: string | Date;
  capacity: number;
  registrationCount?: number;
}): boolean {
  if (event.status !== "upcoming") return false;
  if (Date.now() > new Date(event.registrationDeadline).getTime()) return false;
  return (event.registrationCount ?? 0) < event.capacity;
}
