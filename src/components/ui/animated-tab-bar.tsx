import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useThemeColors, type ThemeColors } from "@/lib/colors";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "./animated-pressable";

type BottomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];
type BottomTabNavigationOptions =
  BottomTabBarProps["descriptors"][string]["options"];

export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: colors.background,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingHorizontal: 16,
        paddingTop: 8,
      }}
    >
      <View className="flex-row items-center bg-card rounded-3xl border border-border p-2">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          return (
            <TabBarButton
              key={route.key}
              options={options}
              isFocused={isFocused}
              colors={colors}
              routeName={route.name}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented)
                  navigation.navigate(route.name, route.params);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabBarButton({
  options,
  isFocused,
  onPress,
  onLongPress,
  colors,
  routeName,
}: {
  options: BottomTabNavigationOptions;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  colors: ThemeColors;
  routeName: string;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isFocused ? 1 : 0, {
      duration: 180,
      reduceMotion: ReduceMotion.System,
    }),
  }));
  const badge =
    typeof options.tabBarBadge === "number" && options.tabBarBadge > 99
      ? "99+"
      : options.tabBarBadge;
  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={
        options.tabBarAccessibilityLabel ?? options.title ?? routeName
      }
      onPress={onPress}
      onLongPress={onLongPress}
      className="items-center justify-center flex-1 min-h-14 py-2"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          animatedStyle,
          { backgroundColor: colors.accent, borderRadius: 18 },
        ]}
      />
      {options.tabBarIcon?.({
        focused: isFocused,
        color: isFocused ? colors.primary : colors.mutedForeground,
        size: 23,
      })}
      <Text
        style={{
          color: isFocused ? colors.primary : colors.mutedForeground,
          fontSize: 11,
          marginTop: 4,
          fontWeight: "600",
        }}
      >
        {options.title ?? routeName}
      </Text>
      {badge !== undefined && (
        <View className="absolute top-0 right-2 bg-destructive rounded-full min-w-[18px] items-center justify-center px-1">
          <Text className="text-[10px] text-destructive-foreground font-bold">
            {badge}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}
