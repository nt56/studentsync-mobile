import { IconButton } from "@/components/ui/button";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/states";
import { apiErrorMessage } from "@/lib/base-query";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/colors";
import {
  NOTIFICATIONS_LIMIT,
  useClearNotificationsMutation,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} from "@/store/api/notification-api";
import type { NotificationType } from "@/types/notification";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import { Alert, Pressable, RefreshControl, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";

const ICON: Record<
  NotificationType,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  registration_confirmed: "check-circle-outline",
  event_reminder: "clock-alert-outline",
  deadline_approaching: "timer-sand",
  event_updated: "pencil-outline",
  event_cancelled: "cancel",
  new_registration: "account-plus-outline",
  registration_cancelled: "account-minus-outline",
  new_user: "account-outline",
  new_event: "calendar-plus",
  role_changed: "shield-account-outline",
};

function eventIdFromLink(link: string | null): string | null {
  return link?.match(/^\/events\/([^/?#]+)/)?.[1] ?? null;
}

export default function Notifications() {
  const router = useRouter();
  const colors = useThemeColors();

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetNotificationsQuery(NOTIFICATIONS_LIMIT);

  const [markRead] = useMarkReadMutation();
  const [markAllRead] = useMarkAllReadMutation();
  const [remove] = useDeleteNotificationMutation();
  const [clearAll] = useClearNotificationsMutation();

  const items = data?.items ?? [];
  const unread = data?.unreadCount ?? 0;

  async function runAction(action: { unwrap: () => Promise<unknown> }) {
    try {
      await action.unwrap();
    } catch (err) {
      Alert.alert("Couldn't update alerts", apiErrorMessage(err));
    }
  }

  if (isLoading) return <Spinner />;
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your alerts"
        message={apiErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  function onClearAll() {
    Alert.alert("Clear all alerts?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear all",
        style: "destructive",
        onPress: () => void runAction(clearAll()),
      },
    ]);
  }

  return (
    <View className="flex-1 bg-background">
      <Animated.View
        entering={motion.up}
        className="px-4 pt-4 pb-4 bg-background z-10 flex-row items-center justify-between"
      >
        <Text className="text-3xl font-extrabold text-foreground tracking-tight">
          Alerts
        </Text>

        {items.length > 0 ? (
          <View className="flex-row gap-1">
            <IconButton
              icon="check-all"
              accessibilityLabel="Mark all as read"
              disabled={unread === 0}
              onPress={() => void runAction(markAllRead())}
            />
            <IconButton
              icon="trash-can-outline"
              accessibilityLabel="Clear all alerts"
              onPress={onClearAll}
            />
          </View>
        ) : null}
      </Animated.View>

      <Animated.FlatList
        itemLayoutAnimation={motion.layout}
        data={items}
        ListHeaderComponent={
          data && data.total > items.length ? (
            <Text className="text-sm text-muted-foreground mb-3">
              Showing the latest {items.length} of {data.total} alerts. Dismiss
              alerts to see older ones.
            </Text>
          ) : null
        }
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 gap-4 pb-6"
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
            icon="bell-outline"
            title="No alerts"
            subtitle="Reminders and event updates will land here."
          />
        }
        renderItem={({ item, index }) => {
          const eventId = eventIdFromLink(item.link);

          return (
            <Animated.View
              entering={motion.down.delay(Math.min(index * 35, 175))}
              layout={motion.layout}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (!item.isRead) void runAction(markRead(item.id));
                  if (eventId) {
                    router.push({
                      pathname: "/events/[id]",
                      params: { id: eventId },
                    });
                  }
                }}
                className={cn(
                  "flex-row gap-4 p-4 rounded-2xl border-[1.5px] bg-card shadow-sm active:opacity-70",
                  !item.isRead
                    ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                    : "border-border/60",
                )}
              >
                <View
                  className={cn(
                    "w-12 h-12 rounded-full items-center justify-center",
                    item.isRead ? "bg-muted" : "bg-primary/10",
                  )}
                >
                  <MaterialCommunityIcons
                    name={ICON[item.type] ?? "bell-outline"}
                    size={24}
                    color={
                      item.isRead ? colors.mutedForeground : colors.primary
                    }
                  />
                </View>

                <View className="flex-1 gap-1 justify-center">
                  <Text
                    className={cn(
                      "text-sm text-foreground",
                      item.isRead ? "font-medium" : "font-bold",
                    )}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-sm text-muted-foreground leading-5">
                    {item.message}
                  </Text>
                  <Text className="text-xs text-muted-foreground font-medium mt-1">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </Text>
                </View>

                <View className="justify-center pl-1">
                  <IconButton
                    icon="close"
                    size={20}
                    accessibilityLabel="Dismiss alert"
                    onPress={() => void runAction(remove(item.id))}
                  />
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}
