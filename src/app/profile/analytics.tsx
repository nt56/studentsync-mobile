import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Card, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/misc";
import { ErrorState, Spinner } from "@/components/ui/states";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors } from "@/lib/colors";
import { useGetStudentAnalyticsQuery } from "@/store/api/misc-api";

export default function Analytics() {
  const colors = useThemeColors();
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

  const busiest = Math.max(1, ...data.categoryDistribution.map((c) => c.count));
  const lastMonth = data.registrationTimeline.reduce(
    (sum, day) => sum + day.count,
    0,
  );

  return (
    <Animated.ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 pb-12 gap-6"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInUp.delay(100).springify()} className="flex-row gap-3">
        <Tile 
          label="Total" 
          value={data.totalRegistrations} 
          icon="ticket-confirmation-outline" 
          color={colors.primary} 
          bgClass="bg-primary/10"
        />
        <Tile 
          label="Upcoming" 
          value={data.upcomingCount} 
          icon="calendar-clock-outline"
          color="#f59e0b" // amber-500 equivalent 
          bgClass="bg-[#f59e0b]/10"
        />
        <Tile 
          label="Completed" 
          value={data.completedCount} 
          icon="check-decagram-outline"
          color="#10b981" // emerald-500
          bgClass="bg-[#10b981]/10"
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).springify()}>
        <Card className="gap-4 p-5 rounded-[24px] border-[1.5px] border-border/60 shadow-sm">
          <CardTitle>By category</CardTitle>

          {data.categoryDistribution.length === 0 ? (
            <Text className="text-sm text-muted-foreground">
              Register for an event and it'll show up here.
            </Text>
          ) : (
            data.categoryDistribution.map((entry) => (
              <View key={entry.category} className="gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-semibold capitalize text-foreground">
                    {entry.category}
                  </Text>
                  <Text className="text-sm font-bold text-muted-foreground">
                    {entry.count}
                  </Text>
                </View>
                <ProgressBar progress={entry.count / busiest} />
              </View>
            ))
          )}
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).springify()}>
        <Card className="gap-2 p-5 rounded-[24px] border-[1.5px] border-border/60 shadow-sm">
          <CardTitle>Last 30 days</CardTitle>
          <Text className="text-sm font-medium text-muted-foreground mt-1">
            {lastMonth === 0
              ? "No registrations in the last month."
              : `${lastMonth} registration${lastMonth === 1 ? "" : "s"} in the last month.`}
          </Text>
        </Card>
      </Animated.View>
    </Animated.ScrollView>
  );
}

function Tile({ label, value, icon, color, bgClass }: { label: string; value: number, icon: any, color: string, bgClass: string }) {
  return (
    <Card className="flex-1 items-center gap-2 p-4 rounded-[24px] border-[1.5px] border-border/60 shadow-sm">
      <View className={`w-10 h-10 rounded-full items-center justify-center ${bgClass}`}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text className="text-3xl font-black text-foreground mt-1">{value}</Text>
      <Text className="text-xs font-bold text-muted-foreground text-center leading-tight">{label}</Text>
    </Card>
  );
}
