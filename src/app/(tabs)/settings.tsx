import { AvatarPicker } from "@/components/profile/avatar-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, Spinner } from "@/components/ui/states";
import { useMe, useSignOut } from "@/hooks/use-auth";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors } from "@/lib/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function Settings() {
  const router = useRouter();
  const colors = useThemeColors();
  const { data: me, isLoading, isError, error, refetch } = useMe();
  const { signOut, isSigningOut } = useSignOut();

  if (isLoading) return <Spinner />;
  if (isError || !me) {
    return (
      <ErrorState
        title="Couldn't load your profile"
        message={apiErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  function onSignOut() {
    Alert.alert("Sign out?", "You'll need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => void signOut(),
      },
    ]);
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 pb-20"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={FadeInUp.duration(400).springify()}
        className="items-center gap-3 py-6 mt-4"
      >
        <AvatarPicker
          uri={me.profileImage}
          name={`${me.firstName} ${me.lastName}`}
        />
        <View className="items-center gap-1">
          <Text className="text-2xl font-extrabold text-foreground">
            {me.firstName} {me.lastName}
          </Text>
          <Text className="text-sm font-medium text-muted-foreground">
            {me.email}
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(100).springify()}>
        <Card className="flex-row p-5 rounded-3xl shadow-sm border-[1.5px] border-border/60">
          <Stat label="Registered" value={me.stats.registrationCount} />
          <View className="w-[1.5px] bg-border/60" />
          <Stat label="Upcoming" value={me.stats.upcomingEventsCount} />
        </Card>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(200).springify()}
        className="gap-3 mt-6"
      >
        <Card
          onPress={() => router.push("/profile/edit")}
          className="flex-row items-center justify-between p-4 bg-card shadow-sm border-[1.5px] border-border/60 rounded-[24px]"
        >
          <View className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
              <MaterialCommunityIcons
                name="account-edit-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <Text className="text-base font-bold text-foreground">
              Edit profile
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.mutedForeground}
          />
        </Card>

        <Card
          onPress={() => router.push("/bookmarks")}
          className="flex-row items-center justify-between p-4 bg-card shadow-sm border-[1.5px] border-border/60 rounded-[24px]"
        >
          <View className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
              <MaterialCommunityIcons
                name="bookmark-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <Text className="text-base font-bold text-foreground">
              Saved events
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.mutedForeground}
          />
        </Card>

        <Card
          onPress={() => router.push("/profile/analytics")}
          className="flex-row items-center justify-between p-4 bg-card shadow-sm border-[1.5px] border-border/60 rounded-[24px]"
        >
          <View className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
              <MaterialCommunityIcons
                name="chart-box-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <Text className="text-base font-bold text-foreground">
              My activity
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.mutedForeground}
          />
        </Card>

        <Card
          onPress={() => router.push("/profile/change-password")}
          className="flex-row items-center justify-between p-4 bg-card shadow-sm border-[1.5px] border-border/60 rounded-[24px]"
        >
          <View className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
              <MaterialCommunityIcons
                name="lock-reset"
                size={24}
                color={colors.primary}
              />
            </View>
            <Text className="text-base font-bold text-foreground">
              Change password
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.mutedForeground}
          />
        </Card>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(300).springify()}
        className="mt-8 mb-4"
      >
        <Button
          label="Sign out"
          icon="logout"
          variant="destructive"
          size="lg"
          loading={isSigningOut}
          onPress={onSignOut}
        />
      </Animated.View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 items-center gap-1">
      <Text className="text-3xl font-black text-primary">{value}</Text>
      <Text className="text-sm font-semibold text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}
