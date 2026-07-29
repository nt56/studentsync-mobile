import { CollegePicker } from "@/components/profile/college-picker";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
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
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  FadeOutLeft,
  ZoomIn,
} from "react-native-reanimated";

export default function SignUp() {
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();
  const sessionEstablished = useSessionEstablished();
  const [formError, setFormError] = useState("");
  const [step, setStep] = useState(1);

  const { control, handleSubmit, trigger } = useForm<SignUpForm>({
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
    mode: "onChange",
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof SignUpForm)[] = [];
    if (step === 1)
      fieldsToValidate = ["firstName", "lastName", "gender", "dateOfBirth"];
    if (step === 2) fieldsToValidate = ["email", "phone", "collegeId"];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

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
      className="flex-1 bg-secondary/20"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-4 md:p-6 pt-16"
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInUp.duration(600).springify()}
          className="w-full max-w-md mx-auto bg-card p-6 sm:p-8 rounded-3xl shadow-lg border border-border/50"
        >
          <View className="mb-6 items-center justify-center">
            <Animated.View
              entering={ZoomIn.delay(200).duration(600).springify()}
            >
              <Image
                source={require("../../../assets/images/StudentSync_icon.png")}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text className="text-3xl font-bold text-foreground text-center">
              Create account
            </Text>
            <Text className="mb-6 mt-2 text-base text-muted-foreground text-center">
              {step === 1 && "Step 1: Personal Details"}
              {step === 2 && "Step 2: Contact & Academic"}
              {step === 3 && "Step 3: Security"}
            </Text>

            <View className="flex-row gap-2 mb-8 justify-center px-4">
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </View>
          </Animated.View>

          <View className="min-h-[280px]">
            {step === 1 && (
              <Animated.View
                entering={FadeInRight}
                exiting={FadeOutLeft}
                className="gap-5"
              >
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

                <Controller
                  control={control}
                  name="gender"
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <Select
                      label="Gender"
                      options={GENDERS}
                      value={value}
                      onChange={onChange}
                      error={error?.message}
                      placeholder="Select your gender"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="dateOfBirth"
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <DateField
                      label="Date of birth"
                      value={value}
                      onChange={onChange}
                      error={error?.message}
                      placeholder="You must be at least 16"
                    />
                  )}
                />
              </Animated.View>
            )}

            {step === 2 && (
              <Animated.View
                entering={FadeInRight}
                exiting={FadeOutLeft}
                className="gap-5"
              >
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

                <Controller
                  control={control}
                  name="collegeId"
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <CollegePicker
                      value={value ?? ""}
                      onChange={(id) => onChange(id)}
                      error={error?.message}
                    />
                  )}
                />
              </Animated.View>
            )}

            {step === 3 && (
              <Animated.View
                entering={FadeInRight}
                exiting={FadeOutLeft}
                className="gap-5"
              >
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
              </Animated.View>
            )}
          </View>

          <View className="mt-6 flex-row gap-3">
            {step > 1 && (
              <View className="flex-1">
                <Button
                  label="Back"
                  onPress={handleBack}
                  variant="outline"
                  size="lg"
                />
              </View>
            )}
            <View className="flex-[2]">
              {step < 3 ? (
                <Button label="Next" onPress={handleNext} size="lg" />
              ) : (
                <Button
                  label="Create account"
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading}
                  size="lg"
                />
              )}
            </View>
          </View>

          <Animated.View
            entering={FadeInUp.delay(800).springify()}
            className="mb-2 mt-8 flex-row justify-center gap-1"
          >
            <Text className="text-sm text-muted-foreground">
              Already have an account?
            </Text>
            <Link href="/sign-in" asChild>
              <Text className="text-sm font-semibold text-primary">
                Sign in
              </Text>
            </Link>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
