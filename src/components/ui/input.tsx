import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

export interface InputProps extends Omit<TextInputProps, "className"> {
  label?: string;
  error?: string;
  hint?: string;
  password?: boolean;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  password = false,
  containerClassName,
  ...props
}: InputProps) {
  const colors = useThemeColors();
  const [hidden, setHidden] = useState(password);

  return (
    <View className={cn("gap-1.5", containerClassName)}>
      {label ? (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      ) : null}

      <View className="relative justify-center">
        <TextInput
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={hidden}
          className={cn(
            "rounded-lg border bg-card px-3 py-3 text-base text-foreground",
            error ? "border-destructive" : "border-input",
            password && "pr-12",
          )}
          {...props}
        />

        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            onPress={() => setHidden((v) => !v)}
            className="absolute right-2 h-10 w-10 items-center justify-center"
          >
            <MaterialCommunityIcons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.mutedForeground}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text className="text-xs text-destructive">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}
