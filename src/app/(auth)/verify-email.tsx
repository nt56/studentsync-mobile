import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors } from "@/lib/colors";
import { useResendVerificationMutation } from "@/store/api/auth-api";

/**
 * Email verification is enforced server-side (requireEmailVerification defaults
 * to true), so registration does NOT sign you in and login 403s until the address
 * is confirmed.
 *
 * The verification link opens in a browser and lands on the WEB app — deep-linking
 * it back into the app would need a backend change, because better-auth rejects
 * custom schemes like studentsync:// as an untrusted origin.
 */
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
    <View className="flex-1 items-center justify-center bg-secondary/20 p-4 md:p-6">
      <Animated.View
        entering={FadeInUp.duration(600).springify()}
        className="w-full max-w-md mx-auto bg-card p-6 sm:p-8 rounded-3xl shadow-lg border border-border/50 items-center justify-center gap-4"
      >
        <Animated.View entering={ZoomIn.delay(200).duration(600).springify()}>
          <MaterialCommunityIcons
            name="email-check-outline"
            size={72}
            color={colors.primary}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} className="w-full">
          <Text className="text-center text-2xl font-bold text-foreground">
            Verify your email
          </Text>

          <Text className="text-center text-base text-muted-foreground mt-2">
            {email ? (
              <>
                We sent a verification link to{" "}
                <Text className="font-semibold text-foreground">{email}</Text>. Open
                it, then come back and sign in.
              </>
            ) : (
              "We sent you a verification link. Open it, then come back and sign in."
            )}
          </Text>
        </Animated.View>

        <View className="w-full gap-3 mt-4">
          {message ? (
            <Animated.View entering={FadeInUp.duration(300)} className="w-full rounded-lg bg-success/10 p-3">
              <Text className="text-center text-sm text-success font-medium">{message}</Text>
            </Animated.View>
          ) : null}

          {error ? (
            <Animated.View entering={FadeInUp.duration(300)} className="w-full rounded-lg bg-destructive/10 p-3">
              <Text className="text-center text-sm text-destructive font-medium">{error}</Text>
            </Animated.View>
          ) : null}

          {email ? (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
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

        <Animated.View entering={FadeInUp.delay(300).springify()}>
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
