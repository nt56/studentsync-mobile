import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { apiErrorMessage } from "@/lib/base-query";
import {
  changePasswordSchema,
  type ChangePasswordForm,
} from "@/lib/validators";
import { useChangePasswordMutation } from "@/store/api/auth-api";
import type { ApiError } from "@/types/common";

export default function ChangePassword() {
  const router = useRouter();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [formError, setFormError] = useState("");

  const { control, handleSubmit } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordForm) {
    setFormError("");
    try {
      await changePassword(values).unwrap();
      Alert.alert("Password changed", "Use your new password next time.");
      router.back();
    } catch (err) {
      const error = err as ApiError;
      if (error.status === 401) {
        setFormError("Your current password is incorrect.");
        return;
      }
      setFormError(apiErrorMessage(err, "Couldn't change your password."));
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="gap-4 p-4"
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          control={control}
          name="currentPassword"
          label="Current password"
          password
          autoCapitalize="none"
          autoComplete="current-password"
        />

        <FormField
          control={control}
          name="newPassword"
          label="New password"
          password
          autoCapitalize="none"
          autoComplete="new-password"
          hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
        />

        <FormField
          control={control}
          name="confirmPassword"
          label="Confirm new password"
          password
          autoCapitalize="none"
          autoComplete="new-password"
        />

        {formError ? (
          <View className="rounded-lg bg-destructive/10 p-3">
            <Text className="text-sm text-destructive">{formError}</Text>
          </View>
        ) : null}

        <Button
          label="Change password"
          size="lg"
          loading={isLoading}
          onPress={handleSubmit(onSubmit)}
          className="mt-2"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
