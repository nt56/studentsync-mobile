import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/colors";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { format, parseISO } from "date-fns";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

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
  const colors = useThemeColors();
  const { colorScheme } = useColorScheme();

  // Default the picker to 18 years ago — a far more useful starting point for a
  // date of birth than today, given the server requires 16+.
  const fallback = new Date();
  fallback.setFullYear(fallback.getFullYear() - 18);
  const current = value ? parseISO(value) : fallback;

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
          {value ? format(current, "PPP") : placeholder}
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
          themeVariant={colorScheme === "dark" ? "dark" : "light"}
          accentColor={colors.primary}
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
