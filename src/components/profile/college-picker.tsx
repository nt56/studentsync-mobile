import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Input } from "@/components/ui/input";
import { useDebounced } from "@/hooks/use-debounced";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/colors";
import { useGetCollegesQuery } from "@/store/api/misc-api";

/**
 * Searchable college select. `College` exposes `id` (not `_id`), and passing an
 * empty string clears the affiliation server-side.
 */
export function CollegePicker({
  value,
  initialName,
  onChange,
  error,
  label = "College",
}: {
  value: string;
  initialName?: string;
  onChange: (collegeId: string, collegeName: string) => void;
  error?: string;
  label?: string;
}) {
  const colors = useThemeColors();
  const [name, setName] = useState(initialName ?? "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const search = useDebounced(query, 350);

  const { data, isFetching } = useGetCollegesQuery(
    { search: search || undefined, limit: 20 },
    { skip: !open },
  );

  function select(id: string, collegeName: string) {
    setName(collegeName);
    onChange(id, collegeName);
    setOpen(false);
    setQuery("");
  }

  function clear() {
    setName("");
    onChange("", "");
  }

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">
        {label}
        <Text className="text-muted-foreground"> (optional)</Text>
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((v) => !v)}
        className={cn(
          "flex-row items-center justify-between rounded-lg border bg-card px-3 py-3.5 active:opacity-70",
          error ? "border-destructive" : "border-input",
        )}
      >
        <Text
          className={cn(
            "flex-1 text-base",
            name ? "text-foreground" : "text-muted-foreground",
          )}
          numberOfLines={1}
        >
          {name || "Search for your college"}
        </Text>
        <MaterialCommunityIcons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.mutedForeground}
        />
      </Pressable>

      {value && !open ? (
        <Pressable onPress={clear} accessibilityRole="button">
          <Text className="text-xs text-primary">Clear college</Text>
        </Pressable>
      ) : null}

      {open ? (
        <View className="gap-2 rounded-lg border border-border bg-card p-3">
          <Input
            placeholder="Type to search…"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
          />

          {isFetching ? (
            <ActivityIndicator className="py-3" color={colors.primary} />
          ) : !data?.items.length ? (
            <Text className="py-3 text-center text-sm text-muted-foreground">
              No colleges found
            </Text>
          ) : (
            <View>
              {data.items.map((college) => (
                <Pressable
                  key={college.id}
                  accessibilityRole="button"
                  onPress={() => select(college.id, college.name)}
                  className="border-b border-border py-3 active:opacity-60"
                >
                  <Text className="text-sm font-medium text-foreground">
                    {college.name}
                  </Text>
                  {college.location ? (
                    <Text className="text-xs text-muted-foreground">
                      {college.location}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
