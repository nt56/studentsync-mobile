import { format } from "date-fns";
import { useRouter } from "expo-router";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { StatusBadge } from "@/components/events/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/states";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors } from "@/lib/colors";
import { reconcileStoredStatus } from "@/lib/event-status";
import {
  REGISTRATIONS_ARGS,
  useGetMyRegistrationsQuery,
} from "@/store/api/registration-api";

export default function MyEvents() {
  const router = useRouter();
  const colors = useThemeColors();

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetMyRegistrationsQuery(REGISTRATIONS_ARGS);

  const items = data?.items ?? [];

  if (isLoading) return <Spinner />;
  if (isError) {
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
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
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
            icon="ticket-outline"
            title="No registrations yet"
            subtitle="Register for an event and your ticket will show up here."
            action={{
              label: "Browse events",
              onPress: () => router.replace("/(tabs)"),
            }}
          />
        }
        renderItem={({ item }) => {
          const event = item.event;
          // A registration whose event was deleted has no `event` subset.
          if (!event) return null;

          // `event.status` is the STORED field here (unlike GET /api/events) and
          // this subset carries no deadline, so only the past-date case can be
          // corrected. See reconcileStoredStatus.
          const status = reconcileStoredStatus(event);

          return (
            <Card
              onPress={() =>
                router.push({
                  pathname: "/events/[id]",
                  params: { id: event.id },
                })
              }
              className="gap-2 p-4"
            >
              <View className="flex-row items-start justify-between gap-2">
                <Text
                  className="flex-1 text-base font-semibold text-foreground"
                  numberOfLines={2}
                >
                  {event.title}
                </Text>
                <StatusBadge status={status} />
              </View>

              <Text className="text-xs text-muted-foreground">
                {format(new Date(event.date), "PPP · p")} · {event.venue}
              </Text>

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
            </Card>
          );
        }}
      />
    </View>
  );
}
