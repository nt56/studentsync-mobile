import { format } from "date-fns";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";
import { CategoryBadge, StatusBadge } from "@/components/events/badges";
import { BookmarkButton } from "@/components/events/bookmark-button";
import { ShareButton } from "@/components/events/share-button";
import { VenueMap } from "@/components/events/venue-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, InfoRow } from "@/components/ui/card";
import { CapacityBar, RatingStars } from "@/components/ui/misc";
import { ErrorState, Spinner } from "@/components/ui/states";
import { apiErrorMessage } from "@/lib/base-query";
import { addEventToCalendar } from "@/lib/calendar";
import { canRegister } from "@/lib/event-status";
import {
  cancelEventReminder,
  scheduleEventReminder,
} from "@/lib/notifications";
import { useGetEventQuery } from "@/store/api/event-api";
import {
  useCancelRegistrationMutation,
  useRegisterForEventMutation,
} from "@/store/api/registration-api";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: event, isLoading, isError, error, refetch } = useGetEventQuery(id);
  const [register, { isLoading: isRegistering }] = useRegisterForEventMutation();
  const [cancel, { isLoading: isCancelling }] = useCancelRegistrationMutation();

  if (isLoading) return <Spinner />;
  if (isError || !event) {
    return (
      <ErrorState
        title="Couldn't load this event"
        message={apiErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  const registered = event.registrationCount ?? 0;
  const spotsLeft = event.capacity - registered;
  const joinable = canRegister(event);
  const busy = isRegistering || isCancelling;

  async function onRegister() {
    try {
      await register(event!.id).unwrap();
      // Best-effort local nudge 24h out; failure here must not fail the join.
      void scheduleEventReminder(event!.id, event!.title, event!.date);
      Alert.alert(
        "You're in",
        "Find your QR ticket under My Events.",
      );
    } catch (err) {
      Alert.alert("Couldn't register", apiErrorMessage(err));
    }
  }

  function onCancelPress() {
    Alert.alert(
      "Cancel registration?",
      "You can register again later if spots remain.",
      [
        { text: "Keep my spot", style: "cancel" },
        {
          text: "Cancel registration",
          style: "destructive",
          onPress: async () => {
            try {
              await cancel(event!.id).unwrap();
              void cancelEventReminder(event!.id);
            } catch (err) {
              Alert.alert("Couldn't cancel", apiErrorMessage(err));
            }
          },
        },
      ],
    );
  }

  const actionLabel = event.isRegistered
    ? "Cancel registration"
    : spotsLeft <= 0
      ? "Event is full"
      : event.status === "closed"
        ? "Registration closed"
        : event.status === "completed"
          ? "Event has ended"
          : "Register";

  return (
    <ScrollView className="flex-1 bg-background">
      {event.image ? (
        <Image
          source={{ uri: event.image }}
          style={{ width: "100%", height: 220 }}
          contentFit="cover"
          transition={200}
        />
      ) : null}

      <View className="gap-4 p-4">
        <View className="flex-row flex-wrap gap-2">
          <CategoryBadge category={event.category} />
          <StatusBadge status={event.status} />
          {event.isInterCollege ? (
            <Badge label="Inter-college" tone="primary" />
          ) : null}
          {event.isRegistered ? (
            <Badge label="Registered" tone="success" />
          ) : null}
        </View>

        <Text className="text-2xl font-bold text-foreground">{event.title}</Text>

        {event.reviewCount > 0 ? (
          <RatingStars value={event.averageRating} count={event.reviewCount} />
        ) : null}

        <View className="flex-row items-center">
          <BookmarkButton eventId={event.id} />
          <ShareButton eventId={event.id} title={event.title} />
        </View>

        <Card className="p-4">
          <InfoRow
            label="Date"
            value={format(new Date(event.date), "PPP · p")}
          />
          <InfoRow label="Venue" value={event.venue} />
          <InfoRow
            label="Deadline"
            value={format(new Date(event.registrationDeadline), "PPP")}
          />
        </Card>

        {event.latitude !== null && event.longitude !== null ? (
          <VenueMap
            latitude={event.latitude}
            longitude={event.longitude}
            label={event.venue}
          />
        ) : null}

        <Card className="gap-3 p-4">
          <CardTitle>Capacity</CardTitle>
          <CapacityBar registered={registered} capacity={event.capacity} />
          <Text className="text-sm text-muted-foreground">
            {spotsLeft <= 0
              ? "This event is full."
              : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left.`}
          </Text>
        </Card>

        <View className="gap-2">
          <CardTitle>About</CardTitle>
          <Text className="text-base leading-6 text-muted-foreground">
            {event.description}
          </Text>
        </View>

        <View className="gap-2">
          <Button
            label={actionLabel}
            variant={event.isRegistered ? "outline" : "primary"}
            size="lg"
            loading={busy}
            disabled={busy || (!joinable && !event.isRegistered)}
            onPress={event.isRegistered ? onCancelPress : onRegister}
          />

          <Button
            label="Add to calendar"
            icon="calendar-plus"
            variant="outline"
            onPress={() => void addEventToCalendar(event)}
          />

          {/* Chat is gated server-side: only registered students may post. */}
          {event.isRegistered ? (
            <Button
              label="Open event chat"
              icon="chat"
              variant="tonal"
              onPress={() =>
                router.push({
                  pathname: "/events/[id]/chat",
                  params: { id: event.id },
                })
              }
            />
          ) : null}

          <Button
            label={
              event.status === "completed"
                ? "Reviews · write yours"
                : `Reviews (${event.reviewCount})`
            }
            icon="star-outline"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: "/events/[id]/reviews",
                params: { id: event.id },
              })
            }
          />
        </View>
      </View>
    </ScrollView>
  );
}
