import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useSessionEstablished } from "@/hooks/use-auth";
import { apiErrorMessage } from "@/lib/base-query";
import { signInSchema, type SignInForm } from "@/lib/validators";
import { useLoginMutation } from "@/store/api/auth-api";
import type { ApiError } from "@/types/common";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function SignIn() {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const sessionEstablished = useSessionEstablished();
  const [formError, setFormError] = useState("");

  const { control, handleSubmit } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInForm) {
    setFormError("");
    try {
      await login(values).unwrap();
      sessionEstablished();
    } catch (err) {
      const error = err as ApiError;

      // The server refuses login until the email is verified. Send them to the
      // resend screen rather than leaving them at a dead end.
      if (error.status === 403 && /verif/i.test(error.message)) {
        router.push({
          pathname: "/verify-email",
          params: { email: values.email },
        });
        return;
      }

      // Login is rate-limited to 10/min per IP — and everyone behind one campus
      // NAT shares that bucket, so this fires more often than you'd expect.
      if (error.status === 429) {
        setFormError("Too many attempts. Wait a minute and try again.");
        return;
      }

      setFormError(
        apiErrorMessage(err, "Could not sign in. Check your credentials."),
      );
    }
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
        <Text className="text-3xl font-bold text-foreground">Welcome back</Text>
        <Text className="mb-8 mt-1 text-base text-muted-foreground">
          Sign in to your StudentSync account
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

          <FormField
            control={control}
            name="password"
            label="Password"
            placeholder="Your password"
            password
            autoCapitalize="none"
            autoComplete="current-password"
          />

          <Link href="/forgot-password" asChild>
            <Text className="self-end text-sm font-medium text-primary">
              Forgot password?
            </Text>
          </Link>

          {formError ? (
            <View className="rounded-lg bg-destructive/10 p-3">
              <Text className="text-sm text-destructive">{formError}</Text>
            </View>
          ) : null}

          <Button
            label="Sign in"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            size="lg"
          />
        </View>

        <View className="mt-8 flex-row justify-center gap-1">
          <Text className="text-sm text-muted-foreground">
            Don&apos;t have an account?
          </Text>
          <Link href="/sign-up" asChild>
            <Text className="text-sm font-semibold text-primary">Sign up</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
