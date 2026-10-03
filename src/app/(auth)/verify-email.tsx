import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors } from "@/lib/colors";
import { useResendVerificationMutation } from "@/store/api/auth-api";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";

export default function VerifyEmail() {
  const colors = useThemeColors();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [resend, { isLoading }] = useResendVerificationMutation();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onResend() {
    if (!email) return;
    setMessage("");
    setError("");
    try {
      await resend({ email }).unwrap();
      setMessage("Sent. Check your inbox — and your spam folder.");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not resend the email."));
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-background p-4 md:p-6">
      <Animated.View
        entering={motion.up}
        className="w-full max-w-md mx-auto bg-card p-6 sm:p-8 rounded-3xl shadow-lg border border-border/50 items-center justify-center gap-4"
      >
        <Animated.View entering={motion.zoom.delay(50)}>
          <MaterialCommunityIcons
            name="email-check-outline"
            size={72}
            color={colors.primary}
          />
        </Animated.View>

        <Animated.View entering={motion.down.delay(25)} className="w-full">
          <Text className="text-center text-2xl font-bold text-foreground">
            Verify your email
          </Text>

          <Text className="text-center text-base text-muted-foreground mt-2">
            {email ? (
              <>
                We sent a verification link to{" "}
                <Text className="font-semibold text-foreground">{email}</Text>.
                Open it, then come back and sign in.
              </>
            ) : (
              "We sent you a verification link. Open it, then come back and sign in."
            )}
          </Text>
        </Animated.View>

        <View className="w-full gap-3 mt-4">
          {message ? (
            <Animated.View
              entering={motion.up}
              className="w-full rounded-lg bg-success/10 p-3"
            >
              <Text className="text-center text-sm text-success font-medium">
                {message}
              </Text>
            </Animated.View>
          ) : null}

          {error ? (
            <Animated.View
              entering={motion.up}
              className="w-full rounded-lg bg-destructive/10 p-3"
            >
              <Text className="text-center text-sm text-destructive font-medium">
                {error}
              </Text>
            </Animated.View>
          ) : null}

          {email ? (
            <Animated.View entering={motion.down.delay(50)}>
              <Button
                label="Resend email"
                icon="email-sync-outline"
                variant="outline"
                onPress={onResend}
                loading={isLoading}
                className="w-full"
              />
            </Animated.View>
          ) : null}
        </View>

        <Animated.View entering={motion.up.delay(75)}>
          <Link href="/sign-in" asChild>
            <Text className="mt-4 text-sm font-semibold text-primary">
              Back to sign in
            </Text>
          </Link>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
