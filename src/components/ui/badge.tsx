import { AnimatedPressable } from "./animated-pressable";
import { cn } from "@/lib/cn";
import { Text, View } from "react-native";

export type Tone =
  "neutral" | "primary" | "success" | "warning" | "destructive";

const TONE: Record<Tone, string> = {
  neutral: "bg-muted",
  primary: "bg-accent",
  success: "bg-success/15",
  warning: "bg-warning/15",
  destructive: "bg-destructive/15",
};

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  primary: "text-accent-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function Badge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "self-start rounded-full px-2.5 py-1",
        TONE[tone],
        className,
      )}
    >
      <Text className={cn("text-xs font-medium capitalize", TONE_TEXT[tone])}>
        {label}
      </Text>
    </View>
  );
}

/** A tappable filter chip. */
export function Chip({
  label,
  selected = false,
  onPress,
  className,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
}) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        "min-h-11 justify-center rounded-full border px-4 py-2 active:opacity-70",
        selected ? "border-primary bg-primary" : "border-border bg-transparent",
        className,
      )}
    >
      <Text
        className={cn(
          "text-xs font-medium capitalize",
          selected ? "text-primary-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
