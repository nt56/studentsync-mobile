import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
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
    <View className="flex-1 items-center justify-center gap-4 bg-background p-8">
      <MaterialCommunityIcons
        name="email-check-outline"
        size={72}
        color={colors.primary}
      />

      <Text className="text-center text-2xl font-bold text-foreground">
        Verify your email
      </Text>

      <Text className="text-center text-base text-muted-foreground">
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

      {message ? (
        <View className="w-full rounded-lg bg-success/10 p-3">
          <Text className="text-center text-sm text-success">{message}</Text>
        </View>
      ) : null}

      {error ? (
        <View className="w-full rounded-lg bg-destructive/10 p-3">
          <Text className="text-center text-sm text-destructive">{error}</Text>
        </View>
      ) : null}

      {email ? (
        <Button
          label="Resend email"
          icon="email-sync-outline"
          variant="outline"
          onPress={onResend}
          loading={isLoading}
          className="mt-2 w-full"
        />
      ) : null}

      <Link href="/sign-in" asChild>
        <Text className="mt-2 text-sm font-semibold text-primary">
          Back to sign in
        </Text>
      </Link>
    </View>
  );
}
