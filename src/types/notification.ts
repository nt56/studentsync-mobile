export type NotificationType =
  | "registration_confirmed"
  | "event_reminder"
  | "deadline_approaching"
  | "event_updated"
  | "event_cancelled"
  | "new_registration"
  | "registration_cancelled"
  | "new_user"
  | "new_event"
  | "role_changed";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  isVirtual: boolean;
  createdAt: string;
}

export interface NotificationFeed {
  items: AppNotification[];
  unreadCount: number;
  total: number;
}
