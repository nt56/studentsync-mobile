import { Badge, type Tone } from "@/components/ui/badge";
import type { EventCategory, EventStatus } from "@/types/event";

const STATUS_TONE: Record<EventStatus, Tone> = {
  upcoming: "success",
  closed: "warning",
  completed: "neutral",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return <Badge label={status} tone={STATUS_TONE[status]} />;
}

export function CategoryBadge({ category }: { category: EventCategory }) {
  return <Badge label={category} tone="primary" />;
}
