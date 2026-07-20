import { useRouter } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, InfoRow } from "@/components/ui/card";
import { ErrorState, Spinner } from "@/components/ui/states";
import { useMe, useSignOut } from "@/hooks/use-auth";
import { apiErrorMessage } from "@/lib/base-query";

export default function Profile() {
  const router = useRouter();
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
      contentContainerClassName="gap-4 p-4"
    >
      <View className="items-center gap-3 py-4">
        <AvatarPicker
          uri={me.profileImage}
          name={`${me.firstName} ${me.lastName}`}
        />
        <Text className="text-xl font-bold text-foreground">
          {me.firstName} {me.lastName}
        </Text>
        <Text className="text-sm text-muted-foreground">{me.email}</Text>
      </View>

      <Card className="flex-row p-4">
        <Stat label="Registered" value={me.stats.registrationCount} />
        <View className="w-px bg-border" />
        <Stat label="Upcoming" value={me.stats.upcomingEventsCount} />
      </Card>

      <Card className="gap-1 p-4">
        <CardTitle className="mb-2">Personal information</CardTitle>
        <InfoRow label="Phone" value={me.phone ?? "Not set"} />
        <InfoRow label="Gender" value={me.gender ?? "Not set"} />
        {/* The college NAME lives on me.college; me.collegeId is just an id. */}
        <InfoRow label="College" value={me.college?.name ?? "Not set"} />
        <InfoRow label="Bio" value={me.bio ?? "No bio yet"} />
      </Card>

      <View className="gap-2">
        <Button
          label="My activity"
          icon="chart-box-outline"
          variant="outline"
          onPress={() => router.push("/profile/analytics")}
        />
        <Button
          label="Saved events"
          icon="bookmark-outline"
          variant="outline"
          onPress={() => router.push("/bookmarks")}
        />
        <Button
          label="Edit profile"
          icon="account-edit-outline"
          variant="outline"
          onPress={() => router.push("/profile/edit")}
        />
        <Button
          label="Change password"
          icon="lock-reset"
          variant="outline"
          onPress={() => router.push("/profile/change-password")}
        />
        <Button
          label="Sign out"
          icon="logout"
          variant="destructive"
          loading={isSigningOut}
          onPress={onSignOut}
          className="mt-2"
        />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 items-center gap-1">
      <Text className="text-2xl font-bold text-primary">{value}</Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}
