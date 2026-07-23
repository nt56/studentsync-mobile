import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp, LinearTransition } from "react-native-reanimated";
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

const ICON: Record<NotificationType, keyof typeof MaterialCommunityIcons.glyphMap> =
  {
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

/**
 * Notification `link` is a WEB path (e.g. "/events/abc123"). Translate it into an
 * app route rather than handing the raw string to the router, which would break
 * typed routes and silently fail on anything we don't have a screen for.
 */
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
        onPress: () => void clearAll(),
      },
    ]);
  }

  return (
    <View className="flex-1 bg-background">
      <Animated.View entering={FadeInUp.duration(400).springify()} className="px-4 pt-12 pb-4 bg-background z-10 flex-row items-center justify-between">
        <Text className="text-3xl font-extrabold text-foreground tracking-tight">
          Alerts
        </Text>
        
        {items.length > 0 ? (
          <View className="flex-row gap-1">
            <IconButton
              icon="check-all"
              accessibilityLabel="Mark all as read"
              disabled={unread === 0}
              onPress={() => void markAllRead()}
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
        itemLayoutAnimation={LinearTransition.springify()}
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 gap-4 pb-32"
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
              entering={FadeInDown.delay(Math.min(index * 50, 500)).springify()}
              layout={LinearTransition.springify()}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (!item.isRead) void markRead(item.id);
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
                    : "border-border/60"
                )}
              >
                <View 
                  className={cn(
                    "w-12 h-12 rounded-full items-center justify-center",
                    item.isRead ? "bg-muted" : "bg-primary/10"
                  )}
                >
                  <MaterialCommunityIcons
                    name={ICON[item.type] ?? "bell-outline"}
                    size={24}
                    color={item.isRead ? colors.mutedForeground : colors.primary}
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

                {/* A virtual reminder isn't a stored row — there's nothing to delete. */}
                {!item.isVirtual ? (
                  <View className="justify-center pl-1">
                    <IconButton
                      icon="close"
                      size={20}
                      accessibilityLabel="Dismiss alert"
                      onPress={() => void remove(item.id)}
                    />
                  </View>
                ) : null}
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}
