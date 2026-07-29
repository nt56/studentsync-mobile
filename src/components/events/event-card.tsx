import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/ui/misc";
import { useThemeColors } from "@/lib/colors";
import type { EventResponse } from "@/types/event";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Image } from "expo-image";
import { memo } from "react";
import { Text, View } from "react-native";
import { CategoryBadge, StatusBadge } from "./badges";
import { BookmarkButton } from "./bookmark-button";

function EventCardImpl({
  event,
  onPress,
}: {
  event: EventResponse;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const spotsLeft = event.capacity - (event.registrationCount ?? 0);

  return (
    <Card
      onPress={onPress}
      className="overflow-hidden border-[1.5px] border-border/80 shadow-md shadow-black/10 dark:shadow-white/10"
    >
      {event.image ? (
        <Image
          source={{ uri: event.image }}
          style={{ width: "100%", height: 140 }}
          contentFit="cover"
          transition={150}
        />
      ) : null}

      <View className="gap-2 p-4">
        <View className="flex-row items-start justify-between gap-1">
          <Text
            className="flex-1 text-base font-semibold text-foreground"
            numberOfLines={2}
          >
            {event.title}
          </Text>
          <BookmarkButton eventId={event.id} size={20} />
        </View>

        <View className="flex-row flex-wrap gap-2">
          <CategoryBadge category={event.category} />
          <StatusBadge status={event.status} />
          {event.isRegistered ? (
            <Badge label="Registered" tone="success" />
          ) : null}
        </View>

        <View className="gap-1 mt-1">
          <View className="flex-row items-center gap-1.5">
            <MaterialCommunityIcons
              name="calendar-clock-outline"
              size={14}
              color={colors.mutedForeground}
            />
            <Text className="text-xs text-muted-foreground font-medium">
              {format(new Date(event.date), "PPP · p")}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={colors.mutedForeground}
            />
            <Text
              className="text-xs text-muted-foreground font-medium"
              numberOfLines={1}
            >
              {event.venue}
            </Text>
          </View>
        </View>

        <View className="mt-1 flex-row items-center justify-between">
          {event.reviewCount > 0 ? (
            <RatingStars
              value={event.averageRating}
              count={event.reviewCount}
              size={13}
            />
          ) : (
            <Text className="text-xs text-muted-foreground">
              No reviews yet
            </Text>
          )}

          <Text
            className={
              spotsLeft <= 0
                ? "text-xs font-medium text-destructive"
                : "text-xs font-medium text-muted-foreground"
            }
          >
            {spotsLeft <= 0
              ? "Full"
              : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
          </Text>
        </View>
      </View>
    </Card>
  );
}

// Lists re-render on every bookmark toggle; memo keeps it to the card that changed.
export const EventCard = memo(EventCardImpl);
