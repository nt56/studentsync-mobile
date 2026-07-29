import { ENDPOINTS } from "@/constants/api";
import type { CreateReviewInput, Review } from "@/types/review";
import { baseApi } from "./base-api";

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getReviews: build.query<Review[], string>({
      query: (eventId) => ({ url: ENDPOINTS.EVENT_REVIEWS(eventId) }),
      providesTags: (_result, _error, eventId) => [
        { type: "Review", id: eventId },
      ],
    }),

    createReview: build.mutation<
      null,
      { eventId: string; input: CreateReviewInput }
    >({
      query: ({ eventId, input }) => ({
        url: ENDPOINTS.EVENT_REVIEWS(eventId),
        method: "POST",
        data: input,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "Review", id: eventId },
        { type: "Event", id: eventId },
        { type: "Event", id: "LIST" },
      ],
    }),

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
