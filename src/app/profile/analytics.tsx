import { ScrollView, Text, View } from "react-native";
import { Card, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/misc";
import { ErrorState, Spinner } from "@/components/ui/states";
import { apiErrorMessage } from "@/lib/base-query";
import { useGetStudentAnalyticsQuery } from "@/store/api/misc-api";

export default function Analytics() {
  const { data, isLoading, isError, error, refetch } =
    useGetStudentAnalyticsQuery();

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Couldn't load your activity"
        message={apiErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  // Scale the bars against the busiest category, not the total, so a single
  // dominant category doesn't flatten everything else to nothing.
  const busiest = Math.max(1, ...data.categoryDistribution.map((c) => c.count));
  const lastMonth = data.registrationTimeline.reduce(
    (sum, day) => sum + day.count,
    0,
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-4"
    >
      <View className="flex-row gap-3">
        <Tile label="Total" value={data.totalRegistrations} />
        <Tile label="Upcoming" value={data.upcomingCount} />
        <Tile label="Completed" value={data.completedCount} />
      </View>

      <Card className="gap-3 p-4">
        <CardTitle>By category</CardTitle>

        {data.categoryDistribution.length === 0 ? (
          <Text className="text-sm text-muted-foreground">
            Register for an event and it&apos;ll show up here.
          </Text>
        ) : (
          data.categoryDistribution.map((entry) => (
            <View key={entry.category} className="gap-1.5">
              <View className="flex-row justify-between">
                <Text className="text-sm capitalize text-foreground">
                  {entry.category}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {entry.count}
                </Text>
              </View>
              <ProgressBar progress={entry.count / busiest} />
            </View>
          ))
        )}
      </Card>

      <Card className="gap-2 p-4">
        <CardTitle>Last 30 days</CardTitle>
        <Text className="text-sm text-muted-foreground">
          {lastMonth === 0
            ? "No registrations in the last month."
            : `${lastMonth} registration${lastMonth === 1 ? "" : "s"} in the last month.`}
        </Text>
      </Card>
    </ScrollView>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="flex-1 items-center gap-1 p-4">
      <Text className="text-2xl font-bold text-primary">{value}</Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </Card>
  );
}
