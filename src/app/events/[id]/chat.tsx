import { ChatInput } from "@/components/chat/chat-input";
import { MessageBubble } from "@/components/chat/message-bubble";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/states";
import { useMe } from "@/hooks/use-auth";
import { useEventChat } from "@/hooks/use-event-chat";
import { apiErrorMessage } from "@/lib/base-query";
import type { ChatMessage } from "@/types/chat";
import { useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import Animated, { FadeInUp, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EventChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const { data: me } = useMe();
  const myName = me ? `${me.firstName} ${me.lastName}`.trim() : "Someone";

  const {
    messages,
    isLoading,
    isError,
    error,
    refetch,
    connected,
    typingUser,
    sendMessage,
    isSending,
    notifyTyping,
  } = useEventChat(id, myName);

  async function onSend(content: string) {
    try {
      await sendMessage(content);
    } catch (err) {
      Alert.alert("Message not sent", apiErrorMessage(err));
    }
  }

  if (isLoading) return <Spinner />;
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load the chat"
        message={apiErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 92 : 0}
      className="flex-1 bg-background"
    >
      {!connected ? (
        <Text className="bg-warning/15 py-1.5 text-center text-xs text-warning">
          Reconnecting…
        </Text>
      ) : null}

      <Animated.FlatList
        ref={listRef as any}
        itemLayoutAnimation={LinearTransition.springify()}
        data={messages}
        keyExtractor={(message) => message._id}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInUp.delay(Math.min(index * 20, 300)).springify()}
          >
            <MessageBubble
              message={item}
              // senderId._id is the Mongo user id — the same value /api/users/me
              // returns as `id`.
              mine={item.senderId?._id === me?.id}
            />
          </Animated.View>
        )}
        contentContainerClassName="gap-3 p-4"
        contentContainerStyle={
          messages.length === 0 ? { flexGrow: 1 } : undefined
        }
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <EmptyState
            icon="chat-outline"
            title="No messages yet"
            subtitle="Say hello to the others going to this event."
          />
        }
      />

      {typingUser && typingUser !== myName ? (
        <Text className="px-4 pb-1 text-xs italic text-muted-foreground">
          {typingUser} is typing…
        </Text>
      ) : null}

      <Animated.View
        entering={FadeInUp.delay(400).springify()}
        style={{ paddingBottom: insets.bottom }}
      >
        <ChatInput
          onSend={(content) => void onSend(content)}
          onTyping={notifyTyping}
          disabled={isSending}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
