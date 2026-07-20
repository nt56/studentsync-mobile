import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors } from "@/lib/colors";
import {
  forgotPasswordSchema,
  type ForgotPasswordForm,
} from "@/lib/validators";
import { useRequestPasswordResetMutation } from "@/store/api/auth-api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function ForgotPassword() {
  const colors = useThemeColors();
  const [requestReset, { isLoading }] = useRequestPasswordResetMutation();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordForm) {
    setError("");
    try {
      await requestReset(values).unwrap();
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not send the reset link."));
    }
  }

  if (sent) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-8">
        <MaterialCommunityIcons
          name="email-fast-outline"
          size={72}
          color={colors.primary}
        />
        <Text className="text-center text-2xl font-bold text-foreground">
          Check your email
        </Text>
        <Text className="text-center text-base text-muted-foreground">
          If an account exists for that address, we&apos;ve sent a password
          reset link. Open it in your browser to choose a new password, then
          come back and sign in.
        </Text>
        <Link href="/sign-in" asChild>
          <Text className="mt-2 text-sm font-semibold text-primary">
            Back to sign in
          </Text>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-foreground">
          Forgot password
        </Text>
        <Text className="mb-8 mt-1 text-base text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </Text>

        <View className="gap-4">
          <FormField
            control={control}
            name="email"
            label="Email"
            placeholder="you@college.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
          />

          {error ? (
            <View className="rounded-lg bg-destructive/10 p-3">
              <Text className="text-sm text-destructive">{error}</Text>
            </View>
          ) : null}

          <Button
            label="Send reset link"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            size="lg"
          />
        </View>

        <View className="mt-8 flex-row justify-center">
          <Link href="/sign-in" asChild>
            <Text className="text-sm font-semibold text-primary">
              Back to sign in
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
