import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "./button";

export function Spinner({ className }: { className?: string }) {
  const colors = useThemeColors();
  return (
    <View className={cn("flex-1 items-center justify-center", className)}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function EmptyState({
  icon = "inbox-outline",
  title,
  subtitle,
  action,
}: {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <MaterialCommunityIcons
        name={icon}
        size={56}
        color={colors.mutedForeground}
      />
      <Text className="text-center text-lg font-semibold text-foreground">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-center text-sm text-muted-foreground">
          {subtitle}
        </Text>
      ) : null}
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="tonal"
          className="mt-2"
        />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={56}
        color={colors.destructive}
      />
      <Text className="text-center text-lg font-semibold text-foreground">
        {title}
      </Text>
      {message ? (
        <Text className="text-center text-sm text-muted-foreground">
          {message}
        </Text>
      ) : null}
      {onRetry ? (
        <Button
          label="Try again"
          icon="refresh"
          onPress={onRetry}
          variant="outline"
          className="mt-2"
        />
      ) : null}
    </View>
  );
}
