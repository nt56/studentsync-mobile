import { ENDPOINTS } from "@/constants/api";
import type { CreateReviewInput, Review } from "@/types/review";
import { baseApi } from "./base-api";

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Bare array (newest first) — not paginated. */
    getReviews: build.query<Review[], string>({
      query: (eventId) => ({ url: ENDPOINTS.EVENT_REVIEWS(eventId) }),
      providesTags: (_result, _error, eventId) => [
        { type: "Review", id: eventId },
      ],
    }),

    /**
     * Gated server-side by three rules, all of which the UI should pre-check so
     * students aren't surprised: the event must be `completed`, the student must
     * be registered, and one review each (a duplicate is a 409).
     */
    createReview: build.mutation<
      null,
      { eventId: string; input: CreateReviewInput }
    >({
      query: ({ eventId, input }) => ({
        url: ENDPOINTS.EVENT_REVIEWS(eventId),
        method: "POST",
        data: input,
      }),
      // Posting recomputes the event's averageRating and reviewCount.
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "Review", id: eventId },
        { type: "Event", id: eventId },
        { type: "Event", id: "LIST" },
      ],
    }),

    /** There is no edit endpoint — delete and re-create. */
    deleteReview: build.mutation<null, { reviewId: string; eventId: string }>({
      query: ({ reviewId }) => ({
        url: ENDPOINTS.REVIEW(reviewId),
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "Review", id: eventId },
        { type: "Event", id: eventId },
        { type: "Event", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetReviewsQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
} = reviewApi;
