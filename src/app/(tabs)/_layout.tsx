import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { IconButton } from "@/components/ui/button";
import { useHydrateBookmarks } from "@/hooks/use-bookmarks";
import { useThemeColors } from "@/lib/colors";
import {
  NOTIFICATIONS_LIMIT,
  useGetNotificationsQuery,
} from "@/store/api/notification-api";

export default function TabsLayout() {
  const colors = useThemeColors();
  const router = useRouter();

  // Keeps the saved-event id set fresh so every card's bookmark icon is correct
  // on first paint, on every screen.
  useHydrateBookmarks();

  // Drives the unread badge. Polling is the only option: there's no push channel,
  // and RTK's refetchOnFocus is wired to AppState (see store/index.ts).
  const { data } = useGetNotificationsQuery(NOTIFICATIONS_LIMIT, {
    pollingInterval: 60_000,
  });
  const unread = data?.unreadCount ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-search"
              color={color}
              size={size}
            />
          ),
          headerRight: () => (
            <IconButton
              icon="bookmark-outline"
              accessibilityLabel="Saved events"
              className="mr-2"
              onPress={() => router.push("/bookmarks")}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-events"
        options={{
          title: "My Events",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="ticket-confirmation"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
