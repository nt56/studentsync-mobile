import { API_BASE_URL, SOCKET_PATH } from "@/constants/api";
import {
  chatApi,
  chatArgs,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
} from "@/store/api/chat-api";
import { useAppDispatch } from "@/store/hooks";
import type { ChatMessage } from "@/types/chat";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { session } from "@/lib/session";

export function useEventChat(eventId: string, currentUserName: string) {
  const dispatch = useAppDispatch();

  const { data, isLoading, isError, error, refetch } = useGetMessagesQuery(
    chatArgs(eventId),
    { pollingInterval: 30_000, skipPollingIfUnfocused: true },
  );
  const [send, { isLoading: isSending }] = useSendMessageMutation();
  const [loadHistory, { isFetching: isLoadingOlder }] =
    useLazyGetMessagesQuery();
  const [olderMessages, setOlderMessages] = useState<ChatMessage[]>([]);
  const [hasOlder, setHasOlder] = useState<boolean | null>(null);

  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      forceNew: true,
      autoConnect: false,
    });
    socketRef.current = socket;

    const join = () =>
      socket.emit("join-room", { eventId }, (result: { ok: boolean }) => {
        setConnected(result.ok);
        setConnectionError(
          result.ok ? null : "You no longer have access to this chat.",
        );
        if (result.ok) void refetch();
      });
    let typingTimer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    void session
      .get()
      .then((cookie) => {
        if (!active) return;
        if (!cookie) {
          setConnectionError("Sign in again to connect to chat.");
          return;
        }
        socket.io.opts.extraHeaders = { Cookie: cookie };
        socket.connect();
      })
      .catch(() => {
        if (active)
          setConnectionError("Couldn't read your session. Sign in again.");
      });

    socket.on("connect", () => {
      join();
    });
    socket.on("connect_error", () => {
      setConnected(false);
      setConnectionError(
        "Live chat is unavailable. Messages refresh automatically.",
      );
    });
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
      setOlderMessages((items) =>
        items.filter((item) => item._id !== messageId),
      );
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
      active = false;
      clearTimeout(typingTimer);
      socket.emit("leave-room", { eventId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [eventId, dispatch, refetch]);

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

  const messages = [
    ...new Map(
      [...olderMessages, ...(data?.messages ?? [])].map((message) => [
        message._id,
        message,
      ]),
    ).values(),
  ].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  async function loadOlder() {
    if (isLoadingOlder || !messages[0]) return;
    const history = await loadHistory({
      ...chatArgs(eventId),
      before: messages[0].createdAt,
    }).unwrap();
    setOlderMessages((items) => [...history.messages, ...items]);
    setHasOlder(history.hasMore);
  }

  return {
    messages,
    loadOlder,
    isLoadingOlder,
    hasOlder: hasOlder ?? data?.hasMore ?? false,
    isLoading,
    isError,
    error,
    refetch,
    connected,
    connectionError,
    typingUser,
    sendMessage,
    isSending,
    notifyTyping,
  };
}
