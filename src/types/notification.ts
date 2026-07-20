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
  /** A web path, e.g. "/events/abc123". */
  link: string | null;
  isRead: boolean;
  /**
   * True for synthetic reminders the server injects for events starting within
   * 48h. Their `id` starts with "vr_" and PATCH/DELETE on them is a no-op.
   */
  isVirtual: boolean;
  createdAt: string;
}

/** GET /api/notifications — takes only `limit` (<=50). Not page-paginated. */
export interface NotificationFeed {
  items: AppNotification[];
  /** Stored unread + virtual reminders. */
  unreadCount: number;
  total: number;
}
