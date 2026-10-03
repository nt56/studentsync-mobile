import { AnimatedPressable } from "./animated-pressable";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/colors";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ActivityIndicator, Text, View } from "react-native";

type Variant = "primary" | "tonal" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const CONTAINER: Record<Variant, string> = {
  primary: "bg-primary active:opacity-80",
  tonal: "bg-accent active:opacity-80",
  outline: "border border-border bg-transparent active:bg-muted",
  ghost: "bg-transparent active:bg-muted",
  destructive: "bg-destructive active:opacity-80",
};

const LABEL: Record<Variant, string> = {
  primary: "text-primary-foreground",
  tonal: "text-accent-foreground",
  outline: "text-foreground",
  ghost: "text-primary",
  destructive: "text-destructive-foreground",
};

const SIZE: Record<Size, string> = {
  sm: "min-h-11 px-3 py-2",
  md: "h-12 px-4",
  lg: "h-14 px-5",
};

const TEXT_SIZE: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-base",
};

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  className,
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;

  // Icons and the spinner take a raw colour prop, so they can't be themed with
  // a class — resolve it from the JS palette instead.
  const contentColor =
    variant === "primary"
      ? colors.primaryForeground
      : variant === "destructive"
        ? colors.destructiveForeground
        : variant === "tonal"
          ? colors.accentForeground
          : variant === "ghost"
            ? colors.primary
            : colors.foreground;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={(event) => {
        event.stopPropagation();
        onPress?.();
      }}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-lg",
        CONTAINER[variant],
        SIZE[size],
        isDisabled && "opacity-50",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : (
        <>
          {icon ? (
            <MaterialCommunityIcons
              name={icon}
              size={size === "sm" ? 16 : 18}
              color={contentColor}
            />
          ) : null}
          <Text
            className={cn("font-semibold", LABEL[variant], TEXT_SIZE[size])}
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

/** A square icon-only button. */
export function IconButton({
  icon,
  onPress,
  color,
  size = 22,
  disabled = false,
  accessibilityLabel,
  className,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress?: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
  accessibilityLabel: string;
  className?: string;
}) {
  const colors = useThemeColors();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={(event) => {
        event.stopPropagation();
        onPress?.();
      }}
      className={cn(
        "h-11 w-11 items-center justify-center rounded-full active:bg-muted",
        disabled && "opacity-40",
        className,
      )}
    >
      <View>
        <MaterialCommunityIcons
          name={icon}
          size={size}
          color={color ?? colors.foreground}
        />
      </View>
    </AnimatedPressable>
  );
}
