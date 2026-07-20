import DateTimePicker from "@expo/ui/community/datetime-picker";
import { format } from "date-fns";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@/lib/cn";

/**
 * Stores a plain `YYYY-MM-DD` string.
 *
 * That's what POST /api/auth/register wants. PATCH /api/auth/profile needs a
 * strict ISO-8601 datetime instead, but auth-api converts it on the way out, so
 * the form can stay date-only either way.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  placeholder = "Select a date",
}: {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  // Default the picker to 18 years ago — a far more useful starting point for a
  // date of birth than today, given the server requires 16+.
  const fallback = new Date();
  fallback.setFullYear(fallback.getFullYear() - 18);
  const current = value ? new Date(value) : fallback;

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        className={cn(
          "rounded-lg border bg-card px-3 py-3.5 active:opacity-70",
          error ? "border-destructive" : "border-input",
        )}
      >
        <Text
          className={cn(
            "text-base",
            value ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {value ? format(new Date(value), "PPP") : placeholder}
        </Text>
      </Pressable>

      {/*
        presentation="dialog" opens a Material dialog on Android. On iOS the prop
        is ignored and it renders inline, which is why it's mounted conditionally
        and unmounted from both onValueChange and onDismiss.
      */}
      {open ? (
        <DateTimePicker
          value={current}
          mode="date"
          presentation="dialog"
          onValueChange={(_event, selected) => {
            setOpen(false);
            if (selected) onChange(format(selected, "yyyy-MM-dd"));
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}

      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
