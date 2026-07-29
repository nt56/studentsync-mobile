import { Badge } from "@/components/ui/badge";
import { ErrorState, Spinner } from "@/components/ui/states";
import { apiErrorMessage } from "@/lib/base-query";
import { useGetQrTicketQuery } from "@/store/api/registration-api";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function Ticket() {
  const { registrationId } = useLocalSearchParams<{ registrationId: string }>();

  const { data, isLoading, isError, error, refetch } =
    useGetQrTicketQuery(registrationId);

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Couldn't load your ticket"
        message={apiErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="w-full max-w-[340px] rounded-[32px] overflow-hidden bg-card border-[1.5px] border-border/60 shadow-xl"
      >
        {/* Top Section - QR Code (forced white background for scannability) */}
        <View className="bg-white items-center p-8 pt-10 gap-6">
          <Text className="text-2xl font-black text-black text-center tracking-tight">
            Event Pass
          </Text>

          <Image
            source={{ uri: data.qrCode }}
            style={{ width: 220, height: 220 }}
            contentFit="contain"
          />
        </View>

        {/* Dashed Separator */}
        <View className="relative h-0 w-full overflow-visible justify-center z-10">
          <View className="absolute left-[-16px] w-8 h-8 rounded-full bg-background border-[1.5px] border-border/60" />
          <View className="absolute right-[-16px] w-8 h-8 rounded-full bg-background border-[1.5px] border-border/60" />
          <View
            className="w-full border-t-[2.5px] border-dashed border-border/40 mx-4"
            style={{ width: "100%" }}
          />
        </View>

        {/* Bottom Section - Status */}
        <View className="bg-primary/5 p-8 pt-10 pb-10 items-center gap-3">
          <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            Status
          </Text>
          <Badge
            label={data.checkedIn ? "Checked in" : "Not checked in yet"}
            tone={data.checkedIn ? "success" : "warning"}
          />
        </View>
      </Animated.View>

      <Animated.Text
        entering={FadeInUp.delay(300).springify()}
        className="text-center text-sm font-medium text-muted-foreground mt-8 px-4"
      >
        Turn your screen brightness up so the code scans cleanly.
      </Animated.Text>
    </View>
  );
}
