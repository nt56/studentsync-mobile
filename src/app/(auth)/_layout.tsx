import { useThemeColors } from "@/lib/colors";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";

export default function AuthLayout() {
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: reduceMotion ? "none" : "fade",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </SafeAreaView>
  );
}
