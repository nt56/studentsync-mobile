import { Text, View } from "react-native";
import { Chip } from "./badge";

/** A chip-based single-select — used for gender, and cheaper than a native picker. */
export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  formatLabel = (v) => v.replace(/-/g, " "),
}: {
  label: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
  formatLabel?: (value: T) => string;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            label={formatLabel(option)}
            selected={value === option}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
