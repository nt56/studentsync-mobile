import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { CollegePicker } from "@/components/profile/college-picker";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormField } from "@/components/ui/form-field";
import { OptionGroup } from "@/components/ui/option-group";
import { ErrorState, Spinner } from "@/components/ui/states";
import { LIMITS } from "@/constants/api";
import { useMe } from "@/hooks/use-auth";
import { apiErrorMessage } from "@/lib/base-query";
import { editProfileSchema, type EditProfileForm } from "@/lib/validators";
import { useUpdateProfileMutation } from "@/store/api/auth-api";
import { GENDERS, type UpdateProfileInput } from "@/types/auth";

/** The server returns an ISO datetime; DateField works in plain YYYY-MM-DD. */
function toDateOnly(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default function EditProfile() {
  const router = useRouter();
  const { data: me, isLoading, isError, refetch } = useMe();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [formError, setFormError] = useState("");

  if (isLoading) return <Spinner />;
  if (isError || !me) {
    return (
      <ErrorState
        title="Couldn't load your profile"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <EditProfileFields
      key={me.id}
      defaults={{
        firstName: me.firstName ?? "",
        lastName: me.lastName ?? "",
        phone: me.phone ?? "",
        bio: me.bio ?? "",
        gender: me.gender,
        dateOfBirth: toDateOnly(me.dateOfBirth),
        collegeId: me.college?.id ?? "",
      }}
      collegeName={me.college?.name}
      isSaving={isSaving}
      formError={formError}
      onSubmit={async (values) => {
        setFormError("");

        // Send only what's set. `collegeId: ""` is meaningful (it unsets the
        // college), so it's always included; the rest are dropped when blank so
        // we don't trip the server's format checks on an empty string.
        const payload: UpdateProfileInput = {
          firstName: values.firstName,
          lastName: values.lastName,
          collegeId: values.collegeId,
          ...(values.phone ? { phone: values.phone } : {}),
          ...(values.bio ? { bio: values.bio } : {}),
          ...(values.gender ? { gender: values.gender } : {}),
          // auth-api converts this to a strict ISO-8601 datetime, which is what
          // PATCH /api/auth/profile demands (register is laxer).
          ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
        };

        try {
          await updateProfile(payload).unwrap();
          Alert.alert("Saved", "Your profile has been updated.");
          router.back();
        } catch (err) {
          setFormError(apiErrorMessage(err, "Couldn't save your profile."));
        }
      }}
    />
  );
}

function EditProfileFields({
  defaults,
  collegeName,
  isSaving,
  formError,
  onSubmit,
}: {
  defaults: EditProfileForm;
  collegeName?: string;
  isSaving: boolean;
  formError: string;
  onSubmit: (values: EditProfileForm) => void;
}) {
  const { control, handleSubmit } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: defaults,
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="gap-4 p-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row gap-3">
          <FormField
            control={control}
            name="firstName"
            label="First name"
            containerClassName="flex-1"
          />
          <FormField
            control={control}
            name="lastName"
            label="Last name"
            containerClassName="flex-1"
          />
        </View>

        <FormField
          control={control}
          name="phone"
          label="Phone"
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
        />

        <FormField
          control={control}
          name="bio"
          label="Bio"
          placeholder="Tell people a bit about yourself"
          multiline
          numberOfLines={4}
          maxLength={LIMITS.BIO}
          style={{ minHeight: 90, textAlignVertical: "top" }}
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
            />
          )}
        />

        <Controller
          control={control}
          name="collegeId"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <CollegePicker
              value={value}
              initialName={collegeName}
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
          label="Save changes"
          size="lg"
          loading={isSaving}
          onPress={handleSubmit(onSubmit)}
          className="mt-2"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
