import { CategoryBadge, StatusBadge } from "@/components/events/badges";
import { BookmarkButton } from "@/components/events/bookmark-button";
import { ShareButton } from "@/components/events/share-button";
import { VenueMap } from "@/components/events/venue-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CapacityBar, RatingStars } from "@/components/ui/misc";
import { ErrorState, Spinner } from "@/components/ui/states";
import { apiErrorMessage } from "@/lib/base-query";
import { addEventToCalendar } from "@/lib/calendar";
import { useThemeColors } from "@/lib/colors";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const {
    data: event,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEventQuery(id);
  const [register, { isLoading: isRegistering }] =
    useRegisterForEventMutation();
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
      void scheduleEventReminder(event!.id, event!.title, event!.date);
      Alert.alert("You're in", "Find your QR ticket under My Events.");
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
    <View className="flex-1 bg-background">
      <Animated.ScrollView
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}
      >
        {event.image ? (
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="px-4 pt-4"
          >
            <View className="rounded-[32px] overflow-hidden shadow-lg shadow-black/20 dark:shadow-white/10 border-[1.5px] border-border/60 bg-card">
              <Image
                source={{ uri: event.image }}
                style={{ width: "100%", height: 300 }}
                contentFit="cover"
                transition={200}
              />
            </View>
          </Animated.View>
        ) : null}

        <View className="gap-5 p-4 items-center mt-2">
          <Animated.View
            entering={FadeInUp.delay(100).springify()}
            className="flex-row flex-wrap justify-center gap-2"
          >
            <CategoryBadge category={event.category} />
            <StatusBadge status={event.status} />
            {event.isInterCollege ? (
              <Badge label="Inter-college" tone="primary" />
            ) : null}
            {event.isRegistered ? (
              <Badge label="Registered" tone="success" />
            ) : null}
          </Animated.View>

          <Animated.Text
            entering={FadeInUp.delay(200).springify()}
            className="text-3xl font-extrabold text-foreground text-center"
          >
            {event.title}
          </Animated.Text>

          {event.reviewCount > 0 ? (
            <Animated.View entering={FadeInUp.delay(300).springify()}>
              <RatingStars
                value={event.averageRating}
                count={event.reviewCount}
              />
            </Animated.View>
          ) : null}

          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            className="flex-row items-center justify-center gap-6"
          >
            <BookmarkButton eventId={event.id} />
            <ShareButton eventId={event.id} title={event.title} />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(500).springify()}
            className="w-full mt-2"
          >
            <Card className="p-5 flex-row justify-between items-center bg-card shadow-sm dark:shadow-none border-[1.5px] border-border/60">
              <View className="items-center flex-1 gap-1 border-r border-border/50 pr-2">
                <MaterialCommunityIcons
                  name="calendar-clock-outline"
                  size={24}
                  color={colors.primary}
                />
                <Text className="text-xs text-muted-foreground mt-1">Date</Text>
                <Text
                  className="text-sm font-bold text-foreground text-center"
                  numberOfLines={2}
                >
                  {format(new Date(event.date), "MMM d, p")}
                </Text>
              </View>
              <View className="items-center flex-1 gap-1 border-r border-border/50 px-2">
                <MaterialCommunityIcons
                  name="map-marker-radius-outline"
                  size={24}
                  color={colors.primary}
                />
                <Text className="text-xs text-muted-foreground mt-1">
                  Venue
                </Text>
                <Text
                  className="text-sm font-bold text-foreground text-center"
                  numberOfLines={2}
                >
                  {event.venue}
                </Text>
              </View>
              <View className="items-center flex-1 gap-1 pl-2">
                <MaterialCommunityIcons
                  name="timer-sand"
                  size={24}
                  color={colors.primary}
                />
                <Text className="text-xs text-muted-foreground mt-1">
                  Deadline
                </Text>
                <Text
                  className="text-sm font-bold text-foreground text-center"
                  numberOfLines={2}
                >
                  {format(new Date(event.registrationDeadline), "MMM d")}
                </Text>
              </View>
            </Card>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(600).springify()}
            className="w-full"
          >
            {event.latitude !== null && event.longitude !== null ? (
              <View className="mb-4">
                <VenueMap
                  latitude={event.latitude}
                  longitude={event.longitude}
                  label={event.venue}
                />
              </View>
            ) : null}

            <Card className="gap-3 p-5 w-full border-[1.5px] border-border/60">
              <CardTitle>Capacity</CardTitle>
              <CapacityBar registered={registered} capacity={event.capacity} />
              <Text className="text-sm text-muted-foreground text-center">
                {spotsLeft <= 0
                  ? "This event is full."
                  : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left.`}
              </Text>
            </Card>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(700).springify()}
            className="w-full gap-3 bg-card p-5 rounded-3xl border-[1.5px] border-border/60 mt-2"
          >
            <CardTitle className="text-center">About This Event</CardTitle>
            <Text className="text-base leading-7 text-muted-foreground text-center">
              {event.description}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(800).springify()}
            className="w-full gap-3 mt-4"
          >
            <Card
              onPress={() => void addEventToCalendar(event)}
              className="flex-row items-center justify-between p-4 bg-card border-[1.5px] border-border/60 shadow-sm rounded-[24px]"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                  <MaterialCommunityIcons
                    name="calendar-plus"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text className="text-base font-bold text-foreground">
                  Add to calendar
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.mutedForeground}
              />
            </Card>

            {/* Chat is gated server-side: only registered students may post. */}
            {event.isRegistered ? (
              <Card
                onPress={() =>
                  router.push({
                    pathname: "/events/[id]/chat",
                    params: { id: event.id },
                  })
                }
                className="flex-row items-center justify-between p-4 bg-card border-[1.5px] border-border/60 shadow-sm rounded-[24px]"
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                    <MaterialCommunityIcons
                      name="chat-outline"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <Text className="text-base font-bold text-foreground">
                    Open event chat
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.mutedForeground}
                />
              </Card>
            ) : null}

            <Card
              onPress={() =>
                router.push({
                  pathname: "/events/[id]/reviews",
                  params: { id: event.id },
                })
              }
              className="flex-row items-center justify-between p-4 bg-card border-[1.5px] border-border/60 shadow-sm rounded-[24px]"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                  <MaterialCommunityIcons
                    name="star-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View>
                  <Text className="text-base font-bold text-foreground">
                    Reviews
                  </Text>
                  <Text className="text-sm font-medium text-muted-foreground mt-0.5">
                    {event.status === "completed"
                      ? "Write yours"
                      : `${event.reviewCount} total`}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.mutedForeground}
              />
            </Card>
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* Sticky Bottom Footer CTA */}
      <Animated.View
        entering={FadeInUp.delay(900).springify()}
        className="absolute bottom-0 left-0 right-0 p-4 pt-4 pb-8 border-t border-border/50 bg-background/95"
      >
        <Button
          label={actionLabel}
          variant={event.isRegistered ? "outline" : "primary"}
          size="lg"
          loading={busy}
          disabled={busy || (!joinable && !event.isRegistered)}
          onPress={event.isRegistered ? onCancelPress : onRegister}
        />
      </Animated.View>
    </View>
  );
}
