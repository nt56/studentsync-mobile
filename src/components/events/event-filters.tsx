import { Text, View, Pressable } from "react-native";
import { Select } from "@/components/ui/select";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useThemeColors } from "@/lib/colors";
import {
  resetFilters,
  setCategory,
  setInterCollege,
  setSort,
  setStatus,
} from "@/store/slices/filter-slice";
import { EVENT_CATEGORIES, EVENT_STATUSES } from "@/types/event";

const SORT_OPTIONS = [
  { label: "Soonest first", value: "soonest" },
  { label: "Latest first", value: "latest" },
  { label: "A-Z", value: "a-z" },
  { label: "Newest", value: "newest" },
];

const SCOPE_OPTIONS = [
  { label: "All Events", value: "all" },
  { label: "Inter-college", value: "inter-college" },
];

export function EventFilters() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const { category, status, isInterCollege, sortBy, sortOrder } = useAppSelector(
    (s) => s.filters,
  );

  const isDirty =
    category !== "" ||
    status !== "upcoming" ||
    isInterCollege ||
    sortBy !== "date" ||
    sortOrder !== "asc";

  const currentSortValue =
    sortBy === "date" && sortOrder === "asc"
      ? "soonest"
      : sortBy === "date" && sortOrder === "desc"
      ? "latest"
      : sortBy === "title"
      ? "a-z"
      : "newest";

  const handleSortChange = (val: string) => {
    switch (val) {
      case "soonest":
        dispatch(setSort({ sortBy: "date", sortOrder: "asc" }));
        break;
      case "latest":
        dispatch(setSort({ sortBy: "date", sortOrder: "desc" }));
        break;
      case "a-z":
        dispatch(setSort({ sortBy: "title", sortOrder: "asc" }));
        break;
      case "newest":
        dispatch(setSort({ sortBy: "createdAt", sortOrder: "desc" }));
        break;
    }
  };

  return (
    <View className="gap-3 px-4 pb-2 z-10">
      <View className="flex-row gap-2 z-20">
        <View className="flex-1">
          <Select
            placeholder="Status"
            value={status === "" ? "all" : status}
            onChange={(val) => dispatch(setStatus(val === "all" ? "" : (val as any)))}
            options={[{ label: "All Statuses", value: "all" }, ...EVENT_STATUSES]}
          />
        </View>
        <View className="flex-1">
          <Select
            placeholder="Category"
            value={category === "" ? "all" : category}
            onChange={(val) => dispatch(setCategory(val === "all" ? "" : val))}
            options={[{ label: "All Categories", value: "all" }, ...EVENT_CATEGORIES]}
          />
        </View>
      </View>

      <View className="flex-row gap-2 z-10">
        <View className="flex-1">
          <Select
            placeholder="Sort By"
            value={currentSortValue}
            onChange={handleSortChange}
            options={SORT_OPTIONS}
          />
        </View>
        <View className="flex-1">
          <Select
            placeholder="Scope"
            value={isInterCollege ? "inter-college" : "all"}
            onChange={(val) => dispatch(setInterCollege(val === "inter-college"))}
            options={SCOPE_OPTIONS}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-1 h-6">
        {isDirty ? (
          <Pressable 
            onPress={() => dispatch(resetFilters())}
            className="flex-row items-center gap-1 active:opacity-70"
          >
            <MaterialCommunityIcons name="filter-remove-outline" size={16} color={colors.primary} />
            <Text className="text-sm font-medium text-primary">Clear filters</Text>
          </Pressable>
        ) : (
          <Text className="text-xs text-muted-foreground">
            Showing upcoming events, soonest first
          </Text>
        )}
      </View>
    </View>
  );
}
