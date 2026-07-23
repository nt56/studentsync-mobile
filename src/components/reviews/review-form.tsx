import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { StarPicker } from "@/components/ui/misc";
import { LIMITS } from "@/constants/api";
import { reviewSchema, type ReviewForm as ReviewFormValues } from "@/lib/validators";

export function ReviewForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: ReviewFormValues) => void;
  submitting: boolean;
}) {
  const { control, handleSubmit } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: "" },
  });

  return (
    <Card className="gap-4 p-5 rounded-[24px] border-[1.5px] border-border/60 shadow-sm">
      <CardTitle className="text-xl">Write a review</CardTitle>

      <Controller
        control={control}
        name="rating"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View className="gap-1.5">
            <StarPicker value={value} onChange={onChange} />
            {error ? (
              <Text className="text-xs text-destructive">{error.message}</Text>
            ) : null}
          </View>
        )}
      />

      <FormField
        control={control}
        name="comment"
        label="Comment (optional)"
        placeholder="How was it?"
        multiline
        numberOfLines={4}
        maxLength={LIMITS.REVIEW_COMMENT}
        style={{ minHeight: 90, textAlignVertical: "top" }}
      />

      <Button
        label="Submit review"
        onPress={handleSubmit(onSubmit)}
        loading={submitting}
      />
    </Card>
  );
}
