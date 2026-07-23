import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/colors";

export type Option = {
  label: string;
  value: string;
};

export function Select({
  value,
  onChange,
  options: rawOptions,
  label,
  placeholder = "Select an option",
  error,
}: {
  value?: string;
  onChange: (value: string) => void;
  options: (Option | string)[];
  label?: string;
  placeholder?: string;
  error?: string;
}) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  const options: Option[] = rawOptions.map((opt) =>
    typeof opt === "string"
      ? { label: opt.charAt(0).toUpperCase() + opt.slice(1).replace(/-/g, " "), value: opt }
      : opt
  );

  const selectedOption = options.find((opt) => opt.value === value);

  function select(val: string) {
    onChange(val);
    setOpen(false);
  }

  return (
    <View className="gap-1.5 z-50 relative">
      {label ? (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((v) => !v)}
        className={cn(
          "flex-row items-center justify-between rounded-lg border bg-card px-3 py-3.5 active:opacity-70",
          error ? "border-destructive" : "border-input",
          open && "border-primary"
        )}
      >
        <Text
          className={cn(
            "flex-1 text-base",
            selectedOption ? "text-foreground" : "text-muted-foreground",
          )}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <MaterialCommunityIcons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.mutedForeground}
        />
      </Pressable>

      {open ? (
        <Animated.View 
          entering={FadeInUp.duration(200)}
          exiting={FadeOutUp.duration(200)}
          className="absolute top-[100%] left-0 right-0 mt-1 gap-1 rounded-lg border border-border bg-card p-1.5 overflow-hidden shadow-md z-50"
        >
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => select(option.value)}
              className={cn(
                "py-3 px-2 rounded-md active:bg-muted",
                value === option.value && "bg-secondary"
              )}
            >
              <Text className={cn(
                "text-sm font-medium",
                value === option.value ? "text-primary" : "text-foreground"
              )}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
