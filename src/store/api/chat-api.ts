import { ENDPOINTS } from "@/constants/api";
import type { ChatHistory, ChatMessage } from "@/types/chat";
import { baseApi } from "./base-api";

export const CHAT_PAGE_SIZE = 50;
export const chatArgs = (eventId: string) => ({
  eventId,
  limit: CHAT_PAGE_SIZE,
});

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMessages: build.query<
      ChatHistory,
      { eventId: string; limit?: number; before?: string }
    >({
      query: ({ eventId, ...params }) => ({
        url: ENDPOINTS.EVENT_MESSAGES(eventId),
        params,
      }),
    }),

    sendMessage: build.mutation<
      { message: ChatMessage },
      { eventId: string; content: string }
    >({
      query: ({ eventId, content }) => ({
        url: ENDPOINTS.EVENT_MESSAGES(eventId),
        method: "POST",
        data: { content },
      }),
      async onQueryStarted({ eventId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            chatApi.util.updateQueryData(
              "getMessages",
              chatArgs(eventId),
              (draft) => {
                if (!draft.messages.some((m) => m._id === data.message._id)) {
                  draft.messages.push(data.message);
                }
              },
            ),
          );
        } catch {
          // Surfaced by the mutation's error state; nothing to roll back since
          // we never optimistically inserted.
        }
      },
    }),
  }),
});

export const {
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
} = chatApi;
