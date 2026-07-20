import { formatDistanceToNow } from "date-fns";
import { Text, View } from "react-native";
import { IconButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, RatingStars } from "@/components/ui/misc";
import { useThemeColors } from "@/lib/colors";
import type { Review } from "@/types/review";

export function ReviewCard({
  review,
  canDelete,
  onDelete,
}: {
  review: Review;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const colors = useThemeColors();

  // The backend falls back to "Unknown" when it can't resolve a name.
  const name =
    !review.student.name || review.student.name === "Unknown"
      ? "Student"
      : review.student.name;

  return (
    <Card className="gap-2 p-4">
      <View className="flex-row items-center gap-3">
        <Avatar uri={review.student.image} name={name} size={36} />

        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{name}</Text>
          <Text className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(review.createdAt), {
              addSuffix: true,
            })}
          </Text>
        </View>

        {canDelete ? (
          <IconButton
            icon="trash-can-outline"
            size={18}
            color={colors.destructive}
            accessibilityLabel="Delete your review"
            onPress={onDelete}
          />
        ) : null}
      </View>

      <RatingStars value={review.rating} size={15} />

      {review.comment ? (
        <Text className="text-sm leading-5 text-foreground">
          {review.comment}
        </Text>
      ) : null}
    </Card>
  );
}
