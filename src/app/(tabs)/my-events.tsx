import { StatusBadge } from "@/components/events/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/states";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors, type ThemeColors } from "@/lib/colors";
import { ListFooter } from "@/components/ui/list-footer";
import { reconcileStoredStatus } from "@/lib/event-status";
import { useGetEventQuery } from "@/store/api/event-api";
import { useGetRegistrationPagesInfiniteQuery } from "@/store/api/registration-api";
import type { RegistrationWithEvent } from "@/types/registration";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { formatEventTime } from "@/lib/event-time";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { RefreshControl, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";

function MyEventCard({
  item,
  index,
  colors,
}: {
  item: RegistrationWithEvent;
  index: number;
  colors: ThemeColors;
}) {
  const router = useRouter();
  const event = item.event;
  const { data: fullEvent } = useGetEventQuery(event?.id ?? "", {
    skip: !event,
  });
  const image = fullEvent?.image;

  if (!event) return null;

  const status = reconcileStoredStatus(fullEvent ?? event);

  return (
    <Animated.View
      entering={motion.down.delay(Math.min(index * 35, 175))}
      layout={motion.layout}
    >
      <Card
        onPress={() =>
          router.push({
            pathname: "/events/[id]",
            params: { id: event.id },
          })
        }
        className="overflow-hidden border-[1.5px] border-border/80 shadow-md shadow-black/10 dark:shadow-white/10"
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={{ width: "100%", height: 140 }}
            contentFit="cover"
            transition={150}
          />
        ) : null}
        <View className="gap-2 p-4">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="flex-1 text-base font-semibold text-foreground"
              numberOfLines={2}
            >
              {event.title}
            </Text>
            <StatusBadge status={status} />
          </View>

          <View className="gap-1 mt-1">
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons
                name="calendar-clock-outline"
                size={14}
                color={colors.mutedForeground}
              />
              <Text className="text-xs text-muted-foreground font-medium">
                {formatEventTime(
                  event.date,
                  fullEvent?.timeZone ?? event.timeZone,
                )}
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

          {/* The QR only matters before the event happens. */}
          {status === "upcoming" || status === "closed" ? (
            <Button
              label="Show ticket"
              icon="qrcode"
              variant="tonal"
              size="sm"
              className="mt-1 self-start"
              onPress={() =>
                router.push({
                  pathname: "/tickets/[registrationId]",
                  params: { registrationId: item.id },
                })
              }
            />
          ) : null}
        </View>
      </Card>
    </Animated.View>
  );
}

export default function MyEvents() {
  const router = useRouter();
  const colors = useThemeColors();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
  } = useGetRegistrationPagesInfiniteQuery();

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) return <Spinner />;
  if (isError && !data) {
    return (
      <ErrorState
        title="Couldn't load your events"
        message={apiErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Animated.View
        entering={motion.up}
        className="px-4 pt-4 pb-4 z-10 bg-background"
      >
        <Text className="text-3xl font-extrabold text-foreground tracking-tight">
          My Tickets
        </Text>
      </Animated.View>
      <Animated.FlatList
        itemLayoutAnimation={motion.layout}
        data={items}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetching && !isFetchNextPageError)
            void fetchNextPage();
        }}
        ListFooterComponent={
          <ListFooter
            loading={isFetching}
            hasMore={hasNextPage}
            failed={isFetchNextPageError}
            onLoadMore={() => void fetchNextPage()}
          />
        }
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-4 p-4 pb-6"
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
            icon="ticket-outline"
            title="No registrations yet"
            subtitle="Register for an event and your ticket will show up here."
            action={{
              label: "Browse events",
              onPress: () => router.replace("/(tabs)"),
            }}
          />
        }
        renderItem={({ item, index }) => (
          <MyEventCard item={item} index={index} colors={colors} />
        )}
      />
    </View>
  );
}
