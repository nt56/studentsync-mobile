import { useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, RefreshControl, View } from "react-native";
import Animated, { FadeInDown, FadeInUp, LinearTransition } from "react-native-reanimated";
import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { IconButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "react-native";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/states";
import { useDebounced } from "@/hooks/use-debounced";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors } from "@/lib/colors";
import { useGetEventsInfiniteQuery } from "@/store/api/event-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSearch } from "@/store/slices/filter-slice";
import type { EventResponse } from "@/types/event";

export default function Browse() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colors = useThemeColors();

  const filters = useAppSelector((s) => s.filters);
  const search = useDebounced(filters.search, 400);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useGetEventsInfiniteQuery({
    search: search || undefined,
    category: filters.category || undefined,
    status: filters.status || undefined,
    collegeId: filters.collegeId || undefined,
    // Only send it when true — `false` would filter *out* inter-college events
    // rather than meaning "don't care".
    isInterCollege: filters.isInterCollege || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const events = data?.pages.flatMap((page) => page.items) ?? [];

  const renderItem = useCallback(
    ({ item, index }: { item: EventResponse; index: number }) => (
      <Animated.View 
        entering={FadeInDown.delay(Math.min(index * 100, 1000)).springify()}
        layout={LinearTransition.springify()}
      >
        <EventCard
          event={item}
          onPress={() =>
            router.push({ pathname: "/events/[id]", params: { id: item.id } })
          }
        />
      </Animated.View>
    ),
    [router],
  );

  const header = (
    <Animated.View entering={FadeInUp.duration(400).springify()} className="gap-2 pb-2 z-10 bg-background pt-12">
      <View className="px-4 flex-row items-center justify-between">
        <Text className="text-3xl font-extrabold text-foreground tracking-tight">
          Discover
        </Text>
        <IconButton
          icon="bookmark-outline"
          accessibilityLabel="Saved events"
          onPress={() => router.push("/bookmarks")}
        />
      </View>
      <View className="px-4 pt-2 z-10">
        <Input
          placeholder="Search events…"
          value={filters.search}
          onChangeText={(text) => dispatch(setSearch(text))}
          autoCorrect={false}
          returnKeyType="search"
          hint="Search matches whole words in the title and description."
        />
      </View>
      <EventFilters />
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background">
      {header}

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState
          title="Couldn't load events"
          message={apiErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <Animated.FlatList
          itemLayoutAnimation={LinearTransition.springify()}
          data={events}
          renderItem={renderItem}
          keyExtractor={(event) => event.id}
          contentContainerClassName="gap-4 p-4 pb-32"
          contentContainerStyle={events.length === 0 ? { flexGrow: 1 } : undefined}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && events.length > 0}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            // fetchNextPage() while a request is already in flight is a silent
            // no-op in RTK Query, so gate it rather than firing on every scroll.
            if (hasNextPage && !isFetching) void fetchNextPage();
          }}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-remove-outline"
              title="No events found"
              subtitle="Try a different search or clear your filters."
            />
          }
          ListFooterComponent={
            hasNextPage && isFetching ? (
              <ActivityIndicator className="py-4" color={colors.primary} />
            ) : null
          }
        />
      )}
    </View>
  );
}
