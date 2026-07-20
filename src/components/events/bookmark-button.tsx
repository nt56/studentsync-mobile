import { IconButton } from "@/components/ui/button";
import { useIsBookmarked, useToggleBookmark } from "@/hooks/use-bookmarks";
import { useThemeColors } from "@/lib/colors";

export function BookmarkButton({
  eventId,
  size = 22,
}: {
  eventId: string;
  size?: number;
}) {
  const colors = useThemeColors();
  const isBookmarked = useIsBookmarked(eventId);
  const { toggle, isPending } = useToggleBookmark();

  return (
    <IconButton
      icon={isBookmarked ? "bookmark" : "bookmark-outline"}
      size={size}
      color={isBookmarked ? colors.primary : colors.mutedForeground}
      disabled={isPending}
      accessibilityLabel={isBookmarked ? "Remove bookmark" : "Save event"}
      onPress={() => void toggle(eventId, isBookmarked)}
    />
  );
}
