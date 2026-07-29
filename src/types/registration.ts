import type { EventStatus } from "./event";

export interface Registration {
  id: string;
  eventId: string;
  studentId: string;
  registeredAt: string;
}

export interface RegistrationWithEvent extends Registration {
  event?: {
    id: string;
    title: string;
    date: string;
    venue: string;
    status: EventStatus;
    registrationDeadline?: string;
  };
}

export interface QrTicket {
  qrCode: string;
  checkedIn: boolean;
  registrationId: string;
}
