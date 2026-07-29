import { Avatar } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/types/chat";
import { format } from "date-fns";
import { memo } from "react";
import { Text, View } from "react-native";

function MessageBubbleImpl({
  message,
  mine,
}: {
  message: ChatMessage;
  mine: boolean;
}) {
  const sender = message.senderId;

  // The backend can emit `type: "system"` messages, which have no real sender.
  if (message.type === "system") {
    return (
      <Text className="self-center px-6 py-1 text-center text-xs text-muted-foreground">
        {message.content}
      </Text>
    );
  }

  const name = `${sender.firstName} ${sender.lastName}`.trim();

  return (
    <View
      className={cn(
        "max-w-[85%] flex-row items-end gap-2",
        mine ? "self-end" : "self-start",
      )}
    >
      {!mine ? (
        <Avatar uri={sender.profileImage} name={name} size={28} />
      ) : null}

      <View
        className={cn(
          "gap-0.5 px-4 py-2.5 shadow-sm",
          mine
            ? "bg-primary rounded-[24px] rounded-br-sm"
            : "bg-card border-[1.5px] border-border/60 rounded-[24px] rounded-bl-sm",
        )}
      >
        {!mine ? (
          <Text className="text-xs font-semibold text-accent-foreground">
            {name || "Student"}
            {sender.role !== "student" ? (
              <Text className="font-normal text-muted-foreground">
                {" "}
                · {sender.role}
              </Text>
            ) : null}
          </Text>
        ) : null}

        <Text
          className={cn(
            "text-base",
            mine ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {message.content}
        </Text>

        <Text
          className={cn(
            "text-[10px]",
            mine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {format(new Date(message.createdAt), "p")}
        </Text>
      </View>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleImpl);
