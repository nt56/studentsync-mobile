import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@/lib/cn";

/**
 * Deliberately has NO default padding. NativeWind resolves conflicting utilities
 * by CSS specificity, not by their order in the className string, so a base
 * `p-4` that callers try to override with `p-0` would fight unpredictably.
 * Callers pass their own padding.
 */
export function Card({
  children,
  onPress,
  className,
}: {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
}) {
  const classes = cn(
    "rounded-xl border border-border bg-card",
    onPress && "active:opacity-80",
    className,
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className={classes}
      >
        {children}
      </Pressable>
    );
  }
  return <View className={classes}>{children}</View>;
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Text className={cn("text-base font-semibold text-foreground", className)}>
      {children}
    </Text>
  );
}

/** A label/value row, as used on event detail and profile. */
export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View className="flex-row py-1.5">
      <Text className="w-28 text-sm text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-sm font-medium text-foreground">
        {value}
      </Text>
    </View>
  );
}
