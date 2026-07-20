import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL, SOCKET_PATH } from "@/constants/api";
import {
  chatApi,
  chatArgs,
  useGetMessagesQuery,
  useSendMessageMutation,
} from "@/store/api/chat-api";
import { useAppDispatch } from "@/store/hooks";
import type { ChatMessage } from "@/types/chat";

/**
 * Socket.IO is BROADCAST-ONLY here — the server registers no `send-message`
 * handler. You send by POSTing to REST; the server persists the message and then
 * emits `new-message` to the `event:<id>` room. So:
 *
 *     send    -> REST  (students must be registered, or it's a 403)
 *     receive -> socket (new-message, message-deleted, user-typing)
 *
 * Two things the server does that you have to design around:
 *   - it does NOT persist room membership across reconnects, so `join-room` must
 *     be re-emitted on every reconnect, not just the first connect;
 *   - it echoes your own message back over the socket, so every insert has to
 *     dedupe on `_id` (note: `_id`, not `id` — chat messages are raw Mongo docs).
 *
 * Worth knowing: the socket has NO authentication server-side. There's no
 * io.use() middleware, no cookie parsing, no membership check — any client can
 * join any event room and read its history. Nothing to fix from here; it's a
 * backend gap.
 */
export function useEventChat(eventId: string, currentUserName: string) {
  const dispatch = useAppDispatch();

  const { data, isLoading, isError, error, refetch } = useGetMessagesQuery(
    chatArgs(eventId),
  );
  const [send, { isLoading: isSending }] = useSendMessageMutation();

  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      forceNew: true,
    });
    socketRef.current = socket;

    const join = () => socket.emit("join-room", { eventId });
    let typingTimer: ReturnType<typeof setTimeout> | undefined;

    socket.on("connect", () => {
      setConnected(true);
      join();
    });
    socket.io.on("reconnect", join);
    socket.on("disconnect", () => setConnected(false));

    socket.on("new-message", ({ message }: { message: ChatMessage }) => {
      dispatch(
        chatApi.util.updateQueryData(
          "getMessages",
          chatArgs(eventId),
          (draft) => {
            if (!draft.messages.some((m) => m._id === message._id)) {
              draft.messages.push(message);
            }
          },
        ),
      );
    });

    socket.on("message-deleted", ({ messageId }: { messageId: string }) => {
      dispatch(
        chatApi.util.updateQueryData(
          "getMessages",
          chatArgs(eventId),
          (draft) => {
            draft.messages = draft.messages.filter((m) => m._id !== messageId);
          },
        ),
      );
    });

    socket.on("user-typing", ({ user }: { user: string }) => {
      setTypingUser(user);
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => setTypingUser(null), 3000);
    });

    return () => {
      clearTimeout(typingTimer);
      socket.emit("leave-room", { eventId });
      socket.io.off("reconnect", join);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [eventId, dispatch]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      await send({ eventId, content: trimmed }).unwrap();
    },
    [eventId, send],
  );

  const notifyTyping = useCallback(() => {
    socketRef.current?.emit("user-typing", { eventId, user: currentUserName });
  }, [eventId, currentUserName]);

  return {
    messages: data?.messages ?? [],
    isLoading,
    isError,
    error,
    refetch,
    connected,
    typingUser,
    sendMessage,
    isSending,
    notifyTyping,
  };
}
