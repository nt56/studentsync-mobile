import { Avatar } from "@/components/ui/misc";
import { LIMITS, UPLOAD_MIME_TYPES } from "@/constants/api";
import { apiErrorMessage } from "@/lib/base-query";
import { useThemeColors } from "@/lib/colors";
import { useUpdateProfileMutation } from "@/store/api/auth-api";
import { useUploadImageMutation } from "@/store/api/misc-api";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";

export function AvatarPicker({
  uri,
  name,
}: {
  uri?: string | null;
  name?: string;
}) {
  const colors = useThemeColors();
  const [localUri, setLocalUri] = useState<string | null>(null);

  const [upload, { isLoading: isUploading }] = useUploadImageMutation();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const busy = isUploading || isSaving;

  async function pick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo permission needed",
        "Allow photo access to set a profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      // MediaTypeOptions is deprecated in SDK 57 — the current API takes an
      // array of MediaType strings.
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const type = asset.mimeType ?? "image/jpeg";

    // Check the server's own limits up front rather than eating a 400.
    if (!(UPLOAD_MIME_TYPES as readonly string[]).includes(type)) {
      Alert.alert("Unsupported image", "Choose a JPEG, PNG, WebP or GIF.");
      return;
    }
    if (asset.fileSize && asset.fileSize > LIMITS.UPLOAD_BYTES) {
      Alert.alert("Image too large", "Uploads are capped at 5 MB.");
      return;
    }

    setLocalUri(asset.uri);

    try {
      // The upload returns `filePath` (the Cloudinary URL) — NOT `url`. Feed it
      // straight into profileImage, which the server validates as a URL.
      const { filePath } = await upload({
        uri: asset.uri,
        name: asset.fileName ?? "avatar.jpg",
        type,
        category: "profiles",
      }).unwrap();

      await updateProfile({ profileImage: filePath }).unwrap();
    } catch (err) {
      setLocalUri(null);
      Alert.alert("Upload failed", apiErrorMessage(err));
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Change profile photo"
      onPress={() =>
        void pick().catch((err) =>
          Alert.alert("Couldn't open photos", apiErrorMessage(err)),
        )
      }
      disabled={busy}
      className="relative"
    >
      <Avatar uri={localUri ?? uri} name={name} size={96} />

      <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary">
        {busy ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <MaterialCommunityIcons
            name="camera"
            size={15}
            color={colors.primaryForeground}
          />
        )}
      </View>
    </Pressable>
  );
}
