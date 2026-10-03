import { Button } from "@/components/ui/button";
import { ErrorState, Spinner } from "@/components/ui/states";
import { API_BASE_URL } from "@/constants/api";
import { useMe, useSignOut } from "@/hooks/use-auth";
import { apiErrorMessage } from "@/lib/base-query";
import { motion } from "@/lib/motion";
import { openBrowserAsync } from "expo-web-browser";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountStatus() {
  const { data, isLoading, error, refetch } = useMe();
  const { signOut, isSigningOut } = useSignOut();
  if (isLoading) return <Spinner />;
  return (
    <SafeAreaView className="flex-1 bg-background p-6">
      {data ? (
        <Animated.View
          entering={motion.up}
          className="flex-1 justify-center gap-4"
        >
          <Text className="text-3xl font-bold text-foreground">
            StudentSync for students
          </Text>
          <Text className="text-base leading-6 text-muted-foreground">
            Your {data.role} account is supported on the web. Organizer and
            admin tools are planned for the next mobile phase.
          </Text>
          <Button
            label="Open StudentSync web"
            onPress={() => void openBrowserAsync(API_BASE_URL)}
          />
        </Animated.View>
      ) : (
        <ErrorState
          title="Couldn't verify your account"
          message={apiErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      )}
      <View className="py-4">
        <Button
          label="Sign out"
          variant="outline"
          loading={isSigningOut}
          onPress={() => void signOut()}
        />
      </View>
    </SafeAreaView>
  );
}
