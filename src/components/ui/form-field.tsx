import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Input, type InputProps } from "./input";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
} & Omit<InputProps, "value" | "onChangeText" | "onBlur" | "error">;

/**
 * Bridges react-hook-form to a React Native TextInput.
 *
 * You cannot spread {...field} onto a TextInput the way you can on the web:
 * RN's onChange hands you a native event with no `target.value`, so RHF would
 * store an event object instead of a string. Map onChange -> onChangeText.
 */
export function FormField<T extends FieldValues>({
  control,
  name,
  ...inputProps
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <Input
          value={(value as string | undefined) ?? ""}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...inputProps}
        />
      )}
    />
  );
}
