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
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";

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
      className="flex-1 bg-secondary/20"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-4 md:p-6"
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInUp.duration(600).springify()}
          className="w-full max-w-md mx-auto bg-card p-6 sm:p-8 rounded-3xl shadow-lg border border-border/50"
        >
          <View className="mb-8 items-center justify-center">
            <Animated.View
              entering={ZoomIn.delay(200).duration(600).springify()}
            >
              <Image
                source={require("../../../assets/images/StudentSync_icon.png")}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text className="text-3xl font-bold text-foreground text-center">
              Welcome back!
            </Text>
            <Text className="mb-8 mt-2 text-base text-muted-foreground text-center">
              Sign in to your StudentSync account
            </Text>
          </Animated.View>

          <View className="gap-5">
            <Animated.View entering={FadeInDown.delay(200).springify()}>
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
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <FormField
                control={control}
                name="password"
                label="Password"
                placeholder="Your password"
                password
                autoCapitalize="none"
                autoComplete="current-password"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).springify()}
              className="flex-row justify-end"
            >
              <Link href="/forgot-password" asChild>
                <Text className="text-sm font-medium text-primary">
                  Forgot password?
                </Text>
              </Link>
            </Animated.View>

            {formError ? (
              <Animated.View
                entering={FadeInUp.duration(300)}
                className="rounded-lg bg-destructive/10 p-3"
              >
                <Text className="text-sm text-destructive text-center font-medium">
                  {formError}
                </Text>
              </Animated.View>
            ) : null}

            <Animated.View
              entering={FadeInDown.delay(500).springify()}
              className="mt-2"
            >
              <Button
                label="Sign in"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                size="lg"
              />
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeInUp.delay(700).springify()}
            className="mt-8 flex-row justify-center gap-1"
          >
            <Text className="text-sm text-muted-foreground">
              Don&apos;t have an account?
            </Text>
            <Link href="/sign-up" asChild>
              <Text className="text-sm font-semibold text-primary">
                Sign up
              </Text>
            </Link>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
