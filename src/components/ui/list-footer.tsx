import { useThemeColors } from "@/lib/colors";
import { ActivityIndicator, View } from "react-native";
import { Button } from "./button";

export function ListFooter({
  loading,
  hasMore,
  failed,
  onLoadMore,
}: {
  loading: boolean;
  hasMore: boolean;
  failed?: boolean;
  onLoadMore: () => void;
}) {
  const colors = useThemeColors();
  if (!hasMore && !failed) return null;
  return (
    <View className="py-4">
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Button
          label={failed ? "Couldn't load more. Retry" : "Load more"}
          variant="tonal"
          onPress={onLoadMore}
        />
      )}
    </View>
  );
}
