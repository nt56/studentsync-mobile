import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { OptionGroup } from "@/components/ui/option-group";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors } from "@/lib/colors";
import { useAppearance } from "@/providers/theme-provider";
import {
  ensureNotificationPermission,
  reconcileDeviceReminders,
} from "@/lib/notifications";
import { useGetReminderRegistrationsQuery } from "@/store/api/registration-api";
import {
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  type NotificationPreferences,
} from "@/store/api/preferences-api";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Switch,
  Text,
  View,
} from "react-native";

export function Preferences() {
  const colors = useThemeColors();
  const { appearance, setAppearance } = useAppearance();
  const { data, isLoading, isFetching, isError, refetch } =
    useGetPreferencesQuery();
  const [update, { isLoading: saving }] = useUpdatePreferencesMutation();
  const { refetch: refreshReminders } = useGetReminderRegistrationsQuery(
    undefined,
    { skip: !data?.reminders },
  );

  async function save(key: keyof NotificationPreferences, value: boolean) {
    if (!data) return;
    try {
      await update({ ...data, [key]: value }).unwrap();
    } catch (error) {
      Alert.alert("Couldn't save preferences", apiErrorMessage(error));
    }
  }

  return (
    <View className="gap-4 mt-6">
      <Card className="p-5 gap-3">
        <CardTitle>Appearance</CardTitle>
        <OptionGroup
          label="Theme"
          options={["system", "light", "dark"] as const}
          value={appearance}
          onChange={setAppearance}
        />
      </Card>
      <Card className="p-5 gap-4">
        <CardTitle>Notifications</CardTitle>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : isError || !data ? (
          <Button
            label="Retry loading preferences"
            variant="tonal"
            onPress={() => void refetch()}
          />
        ) : (
          <>
            {(
              [
                [
                  "reminders",
                  "Event reminders",
                  "Show in-app reminders and device reminders when permission is enabled.",
                ],
                [
                  "email",
                  "Email updates",
                  "Receive event emails. Account security emails stay enabled.",
                ],
              ] as const
            ).map(([key, label, description]) => (
              <View key={key} className="flex-row items-center gap-4">
                <View className="flex-1 gap-1">
                  <Text className="font-semibold text-foreground">{label}</Text>
                  <Text className="text-sm leading-5 text-muted-foreground">
                    {description}
                  </Text>
                </View>
                <Switch
                  accessibilityLabel={label}
                  value={data[key]}
                  disabled={saving || isFetching}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  onValueChange={(value) => void save(key, value)}
                />
              </View>
            ))}
            <Text className="text-xs text-muted-foreground">
              These preferences sync with your web account.
            </Text>
            {data.reminders ? (
              <Button
                label="Enable device reminders"
                variant="tonal"
                onPress={() => {
                  void ensureNotificationPermission()
                    .then(async (granted) => {
                      if (granted) {
                        const registrations = await refreshReminders().unwrap();
                        await reconcileDeviceReminders(
                          registrations.flatMap((item) =>
                            item.event ? [item.event] : [],
                          ),
                          true,
                        );
                        Alert.alert(
                          "Device reminders enabled",
                          "Upcoming events can remind you 24 hours before they start.",
                        );
                      } else {
                        Alert.alert(
                          "Notifications are disabled",
                          "Enable notifications for StudentSync in your device settings.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Open settings",
                              onPress: () => void Linking.openSettings(),
                            },
                          ],
                        );
                      }
                    })
                    .catch(() =>
                      Alert.alert(
                        "Couldn't enable reminders",
                        "Try again in an installed StudentSync build.",
                      ),
                    );
                }}
              />
            ) : null}
          </>
        )}
      </Card>
    </View>
  );
}
