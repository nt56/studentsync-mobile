import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

export function Avatar({
  uri,
  name,
  size = 40,
}: {
  uri?: string | null;
  name?: string;
  size?: number;
}) {
  const colors = useThemeColors();
  const initials =
    name
      ?.split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() ?? "";

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-accent"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      {initials ? (
        <Text
          className="font-semibold text-accent-foreground"
          style={{ fontSize: size * 0.38 }}
        >
          {initials}
        </Text>
      ) : (
        <MaterialCommunityIcons
          name="account"
          size={size * 0.6}
          color={colors.accentForeground}
        />
      )}
    </View>
  );
}

/** Colour-coded fill: green with room, amber when tight, red when full. */
export function CapacityBar({
  registered,
  capacity,
}: {
  registered: number;
  capacity: number;
}) {
  const ratio = capacity > 0 ? Math.min(registered / capacity, 1) : 0;
  const fill =
    ratio >= 1 ? "bg-destructive" : ratio >= 0.8 ? "bg-warning" : "bg-success";

  return (
    <View className="gap-1.5">
      <View className="h-2 overflow-hidden rounded-full bg-muted">
        <View
          className={cn("h-full rounded-full", fill)}
          style={{ width: `${ratio * 100}%` }}
        />
      </View>
      <Text className="text-xs text-muted-foreground">
        {registered} of {capacity} registered
      </Text>
    </View>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <View className="h-2 overflow-hidden rounded-full bg-muted">
      <View
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.max(0, Math.min(progress, 1)) * 100}%` }}
      />
    </View>
  );
}

/** Read-only star rating. */
export function RatingStars({
  value,
  count,
  size = 16,
}: {
  value: number;
  count?: number;
  size?: number;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <MaterialCommunityIcons
          key={star}
          name={
            value >= star
              ? "star"
              : value >= star - 0.5
                ? "star-half-full"
                : "star-outline"
          }
          size={size}
          color={value >= star - 0.5 ? colors.warning : colors.mutedForeground}
        />
      ))}
      {count !== undefined ? (
        <Text className="ml-1 text-xs text-muted-foreground">
          {value.toFixed(1)} ({count})
        </Text>
      ) : null}
    </View>
  );
}

/** Tappable 1-5 star selector. */
export function StarPicker({
  value,
  onChange,
  size = 34,
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === star }}
          accessibilityLabel={`${star} star${star > 1 ? "s" : ""}`}
          onPress={() => onChange(star)}
          className="p-1 active:opacity-60"
        >
          <MaterialCommunityIcons
            name={value >= star ? "star" : "star-outline"}
            size={size}
            color={value >= star ? colors.warning : colors.mutedForeground}
          />
        </Pressable>
      ))}
    </View>
  );
}
