import { Share } from "react-native";
import { IconButton } from "@/components/ui/button";
import { useThemeColors } from "@/lib/colors";
import { eventWebUrl } from "@/store/api/event-api";

/**
 * There is no share endpoint — the backend also serves the public web pages, so
 * the event's web URL doubles as a universal deep link.
 */
export function ShareButton({
  eventId,
  title,
}: {
  eventId: string;
  title: string;
}) {
  const colors = useThemeColors();

  async function onShare() {
    const url = eventWebUrl(eventId);
    try {
      await Share.share({ title, message: `${title}\n${url}`, url });
    } catch {
      // The user dismissed the share sheet.
    }
  }

  return (
    <IconButton
      icon="share-variant"
      color={colors.mutedForeground}
      accessibilityLabel="Share event"
      onPress={() => void onShare()}
    />
  );
}
