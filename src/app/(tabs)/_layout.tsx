import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { IconButton } from "@/components/ui/button";
import { useHydrateBookmarks } from "@/hooks/use-bookmarks";
import { useThemeColors } from "@/lib/colors";
import {
  NOTIFICATIONS_LIMIT,
  useGetNotificationsQuery,
} from "@/store/api/notification-api";
import { AnimatedTabBar } from "@/components/ui/animated-tab-bar";

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
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Events",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "calendar-month" : "calendar-month-outline"}
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
          headerShown: false,
          title: "My Events",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "ticket-confirmation" : "ticket-confirmation-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          headerShown: false,
          title: "Alerts",
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "bell" : "bell-outline"} 
              color={color} 
              size={size} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "cog" : "cog-outline"} 
              color={color} 
              size={size} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
