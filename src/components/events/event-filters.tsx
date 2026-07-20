import { ScrollView, Text, View } from "react-native";
import { Chip } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetFilters,
  setCategory,
  setInterCollege,
  setSort,
  setStatus,
} from "@/store/slices/filter-slice";
import { EVENT_CATEGORIES, EVENT_STATUSES } from "@/types/event";

export function EventFilters() {
  const dispatch = useAppDispatch();
  const { category, status, isInterCollege, sortBy, sortOrder } = useAppSelector(
    (s) => s.filters,
  );

  const isDirty =
    category !== "" ||
    status !== "upcoming" ||
    isInterCollege ||
    sortBy !== "date" ||
    sortOrder !== "asc";

  return (
    <View className="gap-2 pb-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4"
      >
        {EVENT_STATUSES.map((s) => (
          <Chip
            key={s}
            label={s}
            selected={status === s}
            onPress={() => dispatch(setStatus(status === s ? "" : s))}
          />
        ))}
        <View className="w-px bg-border" />
        {EVENT_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            selected={category === c}
            onPress={() => dispatch(setCategory(category === c ? "" : c))}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4"
      >
        <Chip
          label="Inter-college"
          selected={isInterCollege}
          onPress={() => dispatch(setInterCollege(!isInterCollege))}
        />
        <Chip
          label={sortOrder === "asc" ? "Soonest first" : "Latest first"}
          selected={sortBy === "date"}
          onPress={() =>
            dispatch(
              setSort({
                sortBy: "date",
                sortOrder: sortOrder === "asc" ? "desc" : "asc",
              }),
            )
          }
        />
        <Chip
          label="A-Z"
          selected={sortBy === "title"}
          onPress={() =>
            dispatch(
              setSort({
                sortBy: sortBy === "title" ? "date" : "title",
                sortOrder: "asc",
              }),
            )
          }
        />
        <Chip
          label="Newest"
          selected={sortBy === "createdAt"}
          onPress={() =>
            dispatch(
              setSort({
                sortBy: sortBy === "createdAt" ? "date" : "createdAt",
                sortOrder: "desc",
              }),
            )
          }
        />
        {isDirty ? (
          <Chip label="Reset" onPress={() => dispatch(resetFilters())} />
        ) : null}
      </ScrollView>

      {isDirty ? null : (
        <Text className="px-4 text-xs text-muted-foreground">
          Showing upcoming events, soonest first
        </Text>
      )}
    </View>
  );
}
