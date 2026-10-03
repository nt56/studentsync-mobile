import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors } from "@/lib/colors";
import {
  forgotPasswordSchema,
  type ForgotPasswordForm,
} from "@/lib/validators";
import { useRequestPasswordResetMutation } from "@/store/api/auth-api";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
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
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";

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
      <View className="flex-1 items-center justify-center bg-background p-4 md:p-6">
        <Animated.View
          entering={motion.up}
          className="w-full max-w-md mx-auto bg-card p-6 sm:p-8 rounded-3xl shadow-lg border border-border/50 items-center justify-center gap-4"
        >
          <Animated.View entering={motion.zoom.delay(50)}>
            <MaterialCommunityIcons
              name="email-fast-outline"
              size={72}
              color={colors.primary}
            />
          </Animated.View>
          <Animated.View entering={motion.down.delay(25)}>
            <Text className="text-center text-2xl font-bold text-foreground">
              Check your email
            </Text>
            <Text className="text-center text-base text-muted-foreground mt-2">
              If an account exists for that address, we&apos;ve sent a password
              reset link. Open it in your browser to choose a new password, then
              come back and sign in.
            </Text>
          </Animated.View>
          <Animated.View entering={motion.up.delay(75)}>
            <Link href="/sign-in" asChild>
              <Text className="mt-2 text-sm font-semibold text-primary">
                Back to sign in
              </Text>
            </Link>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-4 md:p-6"
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={motion.up}
          className="w-full max-w-md mx-auto bg-card p-6 sm:p-8 rounded-3xl shadow-lg border border-border/50"
        >
          <View className="mb-8 items-center justify-center">
            <Animated.View entering={motion.zoom.delay(50)}>
              <Image
                source={require("../../../assets/images/StudentSync_icon.png")}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          <Animated.View entering={motion.down.delay(25)}>
            <Text className="text-3xl font-bold text-foreground text-center">
              Forgot password
            </Text>
            <Text className="mb-8 mt-2 text-base text-muted-foreground text-center">
              Enter your email and we&apos;ll send you a reset link.
            </Text>
          </Animated.View>

          <View className="gap-5">
            <Animated.View entering={motion.down.delay(50)}>
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

            {error ? (
              <Animated.View
                entering={motion.up}
                className="rounded-lg bg-destructive/10 p-3"
              >
                <Text className="text-sm text-destructive text-center font-medium">
                  {error}
                </Text>
              </Animated.View>
            ) : null}

            <Animated.View entering={motion.down.delay(75)} className="mt-2">
              <Button
                label="Send reset link"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                size="lg"
              />
            </Animated.View>
          </View>

          <Animated.View
            entering={motion.up.delay(125)}
            className="mt-8 flex-row justify-center"
          >
            <Link href="/sign-in" asChild>
              <Text className="text-sm font-semibold text-primary">
                Back to sign in
              </Text>
            </Link>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
