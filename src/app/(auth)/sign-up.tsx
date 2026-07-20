import { CollegePicker } from "@/components/profile/college-picker";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormField } from "@/components/ui/form-field";
import { OptionGroup } from "@/components/ui/option-group";
import { useSessionEstablished } from "@/hooks/use-auth";
import { apiErrorMessage } from "@/lib/base-query";
import { signUpSchema, type SignUpForm } from "@/lib/validators";
import { useRegisterMutation } from "@/store/api/auth-api";
import { GENDERS } from "@/types/auth";
import type { ApiError } from "@/types/common";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function SignUp() {
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();
  const sessionEstablished = useSessionEstablished();
  const [formError, setFormError] = useState("");

  const { control, handleSubmit } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: undefined,
      dateOfBirth: "",
      phone: "",
      collegeId: "",
    },
  });

  async function onSubmit(values: SignUpForm) {
    setFormError("");
    try {
      const result = await register(values).unwrap();

      if (result.requiresVerification) {
        router.replace({
          pathname: "/verify-email",
          params: { email: values.email },
        });
        return;
      }

      sessionEstablished();
    } catch (err) {
      const error = err as ApiError;

      if (error.status === 429) {
        setFormError(
          "Too many sign-up attempts from this network. Try again in a few minutes.",
        );
        return;
      }
      if (error.status === 409) {
        setFormError("An account with that email already exists.");
        return;
      }

      setFormError(apiErrorMessage(err, "Could not create your account."));
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="flex-grow p-6 pt-16"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-foreground">
          Create account
        </Text>
        <Text className="mb-8 mt-1 text-base text-muted-foreground">
          Join StudentSync and never miss an event
        </Text>

        <View className="gap-4">
          <View className="flex-row gap-3">
            <FormField
              control={control}
              name="firstName"
              label="First name"
              placeholder="Ada"
              containerClassName="flex-1"
              autoComplete="given-name"
            />
            <FormField
              control={control}
              name="lastName"
              label="Last name"
              placeholder="Lovelace"
              containerClassName="flex-1"
              autoComplete="family-name"
            />
          </View>

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
            name="phone"
            label="Phone"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            autoComplete="tel"
            hint="10-15 digits. Spaces, dashes and a country code are fine."
          />

          <FormField
            control={control}
            name="password"
            label="Password"
            placeholder="At least 8 characters"
            password
            autoCapitalize="none"
            autoComplete="new-password"
            hint="Needs an uppercase letter, a lowercase letter and a number."
          />

          <FormField
            control={control}
            name="confirmPassword"
            label="Confirm password"
            placeholder="Re-enter your password"
            password
            autoCapitalize="none"
            autoComplete="new-password"
          />

          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <OptionGroup
                label="Gender"
                options={GENDERS}
                value={value}
                onChange={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <DateField
                label="Date of birth"
                value={value}
                onChange={onChange}
                error={error?.message}
                placeholder="You must be at least 16"
              />
            )}
          />

          <Controller
            control={control}
            name="collegeId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CollegePicker
                value={value ?? ""}
                onChange={(id) => onChange(id)}
                error={error?.message}
              />
            )}
          />

          {formError ? (
            <View className="rounded-lg bg-destructive/10 p-3">
              <Text className="text-sm text-destructive">{formError}</Text>
            </View>
          ) : null}

          <Button
            label="Create account"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            size="lg"
          />
        </View>

        <View className="mb-6 mt-8 flex-row justify-center gap-1">
          <Text className="text-sm text-muted-foreground">
            Already have an account?
          </Text>
          <Link href="/sign-in" asChild>
            <Text className="text-sm font-semibold text-primary">Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
