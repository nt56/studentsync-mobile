import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { IconButton } from "@/components/ui/button";
import { LIMITS } from "@/constants/api";
import { useThemeColors } from "@/lib/colors";

export function ChatInput({
  onSend,
  onTyping,
  disabled = false,
}: {
  onSend: (content: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}) {
  const colors = useThemeColors();
  const [text, setText] = useState("");
  const lastTypingPing = useRef(0);

  function handleChange(value: string) {
    setText(value);

    // Throttle the typing broadcast — one ping per 1.5s is plenty, and every
    // keystroke would flood the room.
    const now = Date.now();
    if (now - lastTypingPing.current > 1500) {
      onTyping();
      lastTypingPing.current = now;
    }
  }

  function submit() {
    const trimmed = text.trim();
    // The server rejects anything outside 1-1000 characters.
    if (!trimmed || trimmed.length > LIMITS.MESSAGE_LENGTH) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <View className="px-4 py-2 bg-transparent">
      <View className="flex-row items-end gap-2 bg-card border-[1.5px] border-border/60 shadow-sm rounded-3xl pl-4 pr-2 py-1.5">
        <TextInput
          placeholder="Message…"
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={handleChange}
          multiline
          maxLength={LIMITS.MESSAGE_LENGTH}
          editable={!disabled}
          className="max-h-32 flex-1 text-base text-foreground py-2"
        />
        <View className={`rounded-full mb-0.5 ${text.trim() && !disabled ? 'bg-primary/10' : 'bg-transparent'}`}>
          <IconButton
            icon="send"
            accessibilityLabel="Send message"
            color={text.trim() && !disabled ? colors.primary : colors.mutedForeground}
            disabled={disabled || !text.trim()}
            onPress={submit}
          />
        </View>
      </View>
    </View>
  );
}
