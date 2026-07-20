import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { ErrorState, Spinner } from "@/components/ui/states";
import { apiErrorMessage } from "@/lib/base-query";
import { useGetQrTicketQuery } from "@/store/api/registration-api";

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
    <View className="flex-1 items-center justify-center gap-6 bg-background p-6">
      <View className="w-full items-center gap-5 rounded-2xl border border-border bg-card p-6">
        <Text className="text-lg font-semibold text-foreground">
          Show this at the entrance
        </Text>

        {/*
          The server returns `qrCode` as a base64 PNG data URL, so it renders
          directly. It encodes a signed 30-day JWT that an organizer scans —
          students only ever display it; check-in is an organizer action.
        */}
        <Image
          source={{ uri: data.qrCode }}
          style={{ width: 260, height: 260 }}
          contentFit="contain"
        />

        <Badge
          label={data.checkedIn ? "Checked in" : "Not checked in yet"}
          tone={data.checkedIn ? "success" : "warning"}
        />
      </View>

      <Text className="text-center text-sm text-muted-foreground">
        Turn your screen brightness up so the code scans cleanly.
      </Text>
    </View>
  );
}
