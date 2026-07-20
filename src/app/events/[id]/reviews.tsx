import { useLocalSearchParams } from "expo-router";
import { Alert, FlatList, Text, View } from "react-native";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewForm } from "@/components/reviews/review-form";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/ui/misc";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/states";
import { useMe } from "@/hooks/use-auth";
import { apiErrorMessage } from "@/lib/base-query";
import { useGetEventQuery } from "@/store/api/event-api";
import {
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useGetReviewsQuery,
} from "@/store/api/review-api";

export default function Reviews() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: me } = useMe();
  const { data: event } = useGetEventQuery(id);
  const {
    data: reviews,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetReviewsQuery(id);

  const [createReview, { isLoading: isCreating }] = useCreateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  if (isLoading) return <Spinner />;
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load reviews"
        message={apiErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  const list = reviews ?? [];
  const myReview = list.find((r) => r.student.id === me?.id);

  // The server enforces all three of these; check them up front so the student
  // isn't surprised by a 400 (or a 409 for a duplicate) after typing a review.
  const canWrite =
    event?.status === "completed" && !!event?.isRegistered && !myReview;

  async function onCreate(values: { rating: number; comment: string }) {
    try {
      await createReview({ eventId: id, input: values }).unwrap();
    } catch (err) {
      Alert.alert("Couldn't submit your review", apiErrorMessage(err));
    }
  }

  function onDelete(reviewId: string) {
    Alert.alert(
      "Delete your review?",
      "There's no edit — you'd need to write a new one.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReview({ reviewId, eventId: id }).unwrap();
            } catch (err) {
              Alert.alert("Couldn't delete", apiErrorMessage(err));
            }
          },
        },
      ],
    );
  }

  function gateMessage(): string | null {
    if (!event) return null;
    if (myReview) return "You've already reviewed this event.";
    if (event.status !== "completed")
      return "Reviews open once the event is over.";
    if (!event.isRegistered)
      return "Only students who attended can review this event.";
    return null;
  }

  const note = gateMessage();

  return (
    <FlatList
      className="flex-1 bg-background"
      data={list}
      keyExtractor={(review) => review.id}
      contentContainerClassName="gap-3 p-4"
      contentContainerStyle={list.length === 0 ? { flexGrow: 1 } : undefined}
      ListHeaderComponent={
        <View className="gap-3">
          {event && event.reviewCount > 0 ? (
            <Card className="items-center gap-1 p-4">
              <Text className="text-3xl font-bold text-foreground">
                {event.averageRating.toFixed(1)}
              </Text>
              <RatingStars value={event.averageRating} size={18} />
              <Text className="text-xs text-muted-foreground">
                {event.reviewCount} review
                {event.reviewCount === 1 ? "" : "s"}
              </Text>
            </Card>
          ) : null}

          {canWrite ? (
            <ReviewForm onSubmit={onCreate} submitting={isCreating} />
          ) : note ? (
            <Text className="px-1 text-sm italic text-muted-foreground">
              {note}
            </Text>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <ReviewCard
          review={item}
          canDelete={item.student.id === me?.id}
          onDelete={() => onDelete(item.id)}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="star-outline"
          title="No reviews yet"
          subtitle="Be the first to share how it went."
        />
      }
    />
  );
}
