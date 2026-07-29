import type { UserRole } from "./auth";

export interface ChatMessage {
  _id: string;
  eventId: string;
  senderId: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    role: UserRole;
  };
  content: string;
  type: "text" | "system";
  isDeleted: boolean;
  createdAt: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  hasMore: boolean;
}
