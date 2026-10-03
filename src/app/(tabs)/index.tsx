import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { Button, IconButton } from "@/components/ui/button";
import { ListFooter } from "@/components/ui/list-footer";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/states";
import { useDebounced } from "@/hooks/use-debounced";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors } from "@/lib/colors";
import { useGetEventsInfiniteQuery } from "@/store/api/event-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSearch } from "@/store/slices/filter-slice";
import type { EventResponse } from "@/types/event";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";

export default function Browse() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const [showFilters, setShowFilters] = useState(false);

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
    isFetchNextPageError,
  } = useGetEventsInfiniteQuery({
    search: search || undefined,
    category: filters.category || undefined,
    status: filters.status || undefined,
    collegeId: filters.collegeId || undefined,
    isInterCollege: filters.isInterCollege || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const events = data?.pages.flatMap((page) => page.items) ?? [];

  const renderItem = useCallback(
    ({ item, index }: { item: EventResponse; index: number }) => (
      <Animated.View
        entering={motion.down.delay(Math.min(index * 35, 175))}
        layout={motion.layout}
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
    <Animated.View
      entering={motion.up}
      className="gap-2 pb-2 z-10 bg-background pt-4"
    >
      <View className="px-4 flex-row items-center justify-between">
        <View className="gap-1 flex-1">
          <Text className="text-3xl font-extrabold text-foreground tracking-tight">
            Discover
          </Text>
          <Text className="text-sm text-muted-foreground">
            Find your next campus experience.
          </Text>
        </View>
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
      <View className="px-4 flex-row justify-between items-center gap-3">
        <Text className="text-sm text-muted-foreground">
          {data?.pages[0]?.pagination.total ?? 0} events
        </Text>
        <Button
          label={showFilters ? "Hide filters" : "Filters"}
          icon="tune-variant"
          variant="tonal"
          size="sm"
          onPress={() => setShowFilters((value) => !value)}
        />
      </View>
      {showFilters ? <EventFilters /> : null}
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background">
      {header}

      {isLoading ? (
        <Spinner />
      ) : isError && !data ? (
        <ErrorState
          title="Couldn't load events"
          message={apiErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <Animated.FlatList
          itemLayoutAnimation={motion.layout}
          data={events}
          renderItem={renderItem}
          keyExtractor={(event) => event.id}
          contentContainerClassName="gap-4 p-4 pb-6"
          contentContainerStyle={
            events.length === 0 ? { flexGrow: 1 } : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={isFetching && events.length > 0}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetching && !isFetchNextPageError)
              void fetchNextPage();
          }}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-remove-outline"
              title="No events found"
              subtitle="Try a different search or clear your filters."
            />
          }
          ListFooterComponent={
            <ListFooter
              loading={isFetching}
              hasMore={hasNextPage}
              failed={isFetchNextPageError}
              onLoadMore={() => void fetchNextPage()}
            />
          }
        />
      )}
    </View>
  );
}
