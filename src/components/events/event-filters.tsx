import { Select } from "@/components/ui/select";
import { useMe } from "@/hooks/use-auth";
import { useThemeColors } from "@/lib/colors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetFilters,
  setCategory,
  setCollegeId,
  setInterCollege,
  setSort,
  setStatus,
} from "@/store/slices/filter-slice";
import {
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  type EventCategory,
  type EventStatus,
} from "@/types/event";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, Text, View } from "react-native";

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
  const { data: me } = useMe();
  const { category, status, collegeId, isInterCollege, sortBy, sortOrder } =
    useAppSelector((s) => s.filters);

  const isDirty =
    category !== "" ||
    collegeId !== "" ||
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
            onChange={(val) =>
              dispatch(setStatus(val === "all" ? "" : (val as EventStatus)))
            }
            options={[
              { label: "All Statuses", value: "all" },
              ...EVENT_STATUSES,
            ]}
          />
        </View>
        <View className="flex-1">
          <Select
            placeholder="Category"
            value={category === "" ? "all" : category}
            onChange={(val) =>
              dispatch(setCategory(val === "all" ? "" : (val as EventCategory)))
            }
            options={[
              { label: "All Categories", value: "all" },
              ...EVENT_CATEGORIES,
            ]}
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
            value={
              collegeId
                ? "my-college"
                : isInterCollege
                  ? "inter-college"
                  : "all"
            }
            onChange={(val) => {
              dispatch(setInterCollege(val === "inter-college"));
              dispatch(
                setCollegeId(val === "my-college" ? (me?.collegeId ?? "") : ""),
              );
            }}
            options={
              me?.collegeId
                ? [
                    ...SCOPE_OPTIONS,
                    { label: "My college", value: "my-college" },
                  ]
                : SCOPE_OPTIONS
            }
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-1 h-6">
        {isDirty ? (
          <Pressable
            onPress={() => dispatch(resetFilters())}
            className="flex-row items-center gap-1 active:opacity-70"
          >
            <MaterialCommunityIcons
              name="filter-remove-outline"
              size={16}
              color={colors.primary}
            />
            <Text className="text-sm font-medium text-primary">
              Clear filters
            </Text>
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
