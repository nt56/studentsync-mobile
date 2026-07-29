import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Linking, Platform, Text } from "react-native";

/**
 * Opens the platform maps app rather than embedding a MapView. react-native-maps
 * would need a config plugin plus a Google Maps API key for Android; Linking
 * needs neither, so it's the default.
 */
export function VenueMap({
  latitude,
  longitude,
  label,
}: {
  latitude: number;
  longitude: number;
  label: string;
}) {
  function openMaps() {
    const query = encodeURIComponent(label);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${query})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    }) as string;
    void Linking.openURL(url);
  }

  return (
    <Card className="gap-3 p-4">
      <CardTitle>Location</CardTitle>
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Button
        label="Get directions"
        icon="directions"
        variant="tonal"
        onPress={openMaps}
      />
    </Card>
  );
}
