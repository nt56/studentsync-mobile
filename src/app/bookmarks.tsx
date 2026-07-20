import { CategoryBadge, StatusBadge } from "@/components/events/badges";
import { BookmarkButton } from "@/components/events/bookmark-button";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/ui/misc";
import { EmptyState, Spinner } from "@/components/ui/states";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useThemeColors } from "@/lib/colors";
import { computeEventStatus } from "@/lib/event-status";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { FlatList, RefreshControl, Text, View } from "react-native";

export default function Bookmarks() {
  const router = useRouter();
  const colors = useThemeColors();
  const { data, isLoading, isFetching, refetch } = useBookmarks();

  const items = data?.items ?? [];

  if (isLoading) return <Spinner />;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={items}
        keyExtractor={(item) => item.bookmarkId}
        contentContainerClassName="gap-3 p-4"
        contentContainerStyle={items.length === 0 ? { flexGrow: 1 } : undefined}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && items.length > 0}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title="No saved events"
            subtitle="Tap the bookmark icon on any event to save it here."
            action={{
              label: "Browse events",
              onPress: () => router.replace("/(tabs)"),
            }}
          />
        }
        renderItem={({ item }) => {
          const status = computeEventStatus(item);

          return (
            <Card
              onPress={() =>
                router.push({
                  pathname: "/events/[id]",
                  params: { id: item.id },
                })
              }
              className="p-4"
            >
              <View className="flex-row items-start justify-between gap-1">
                <Text
                  className="flex-1 text-base font-semibold text-foreground"
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <BookmarkButton eventId={item.id} size={20} />
              </View>

              <View className="mt-2 flex-row flex-wrap gap-2">
                <CategoryBadge category={item.category} />
                <StatusBadge status={status} />
              </View>

              <Text className="mt-2 text-xs text-muted-foreground">
                {format(new Date(item.date), "PPP")} · {item.venue}
              </Text>

              {item.reviewCount > 0 ? (
                <View className="mt-2">
                  <RatingStars
                    value={item.averageRating}
                    count={item.reviewCount}
                    size={13}
                  />
                </View>
              ) : null}
            </Card>
          );
        }}
      />
    </View>
  );
}
