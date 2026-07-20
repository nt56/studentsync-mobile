import { useAuthBootstrap } from "@/hooks/use-auth";
import { useThemeColors } from "@/lib/colors";
import { store } from "@/store";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import "./global.css";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}

function RootNavigator() {
  const { isReady, isAuthenticated } = useAuthBootstrap();
  const colors = useThemeColors();

  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  const header = {
    headerShown: true,
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.foreground,
    headerShadowVisible: false,
  } as const;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="events/[id]/index"
          options={{ ...header, title: "Event" }}
        />
        <Stack.Screen
          name="events/[id]/chat"
          options={{ ...header, title: "Event chat" }}
        />
        <Stack.Screen
          name="events/[id]/reviews"
          options={{ ...header, title: "Reviews" }}
        />
        <Stack.Screen
          name="tickets/[registrationId]"
          options={{ ...header, title: "Your ticket", presentation: "modal" }}
        />
        <Stack.Screen
          name="bookmarks"
          options={{ ...header, title: "Saved events" }}
        />
        <Stack.Screen
          name="profile/edit"
          options={{ ...header, title: "Edit profile" }}
        />
        <Stack.Screen
          name="profile/change-password"
          options={{ ...header, title: "Change password" }}
        />
        <Stack.Screen
          name="profile/analytics"
          options={{ ...header, title: "My activity" }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
