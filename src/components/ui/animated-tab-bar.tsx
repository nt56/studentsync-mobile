import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { View, Pressable, Text, StyleSheet, Platform } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useThemeColors } from "@/lib/colors";

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useThemeColors();

  return (
    <View 
      className="absolute bottom-6 left-6 right-6 flex-row justify-around items-center bg-card rounded-full shadow-lg border border-border/50"
      style={{ paddingVertical: Platform.OS === 'ios' ? 16 : 14, elevation: 10 }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabBarButton 
            key={route.key}
            options={options}
            isFocused={isFocused}
            onPress={onPress}
            colors={colors}
            routeName={route.name}
          />
        );
      })}
    </View>
  );
}

function TabBarButton({ options, isFocused, onPress, colors, routeName }: any) {
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isFocused ? 1.15 : 1) }],
    };
  });

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(isFocused ? 1 : 0),
      transform: [{ scale: withSpring(isFocused ? 1 : 0.4) }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center flex-1 relative h-14"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          animatedIndicatorStyle,
          {
            backgroundColor: colors.primary + "1A", // 10% opacity hex
            borderRadius: 16,
            marginHorizontal: 8,
            marginVertical: 4,
          }
        ]}
      />
      <Animated.View style={animatedIconStyle}>
        {options.tabBarIcon &&
          options.tabBarIcon({
            focused: isFocused,
            color: isFocused ? colors.primary : colors.mutedForeground,
            size: 24,
          })}
      </Animated.View>
      
      <Animated.Text
        style={[
          {
            color: isFocused ? colors.primary : colors.mutedForeground,
            fontSize: 11,
            marginTop: 2,
            fontWeight: isFocused ? "600" : "500",
          }
        ]}
      >
        {options.title !== undefined ? options.title : routeName}
      </Animated.Text>

      {/* Badge Support */}
      {options.tabBarBadge !== undefined && (
        <View className="absolute top-1 right-1/4 bg-destructive rounded-full min-w-[18px] h-[18px] items-center justify-center border-2 border-card">
          <Text className="text-[10px] text-destructive-foreground font-bold px-1">
            {options.tabBarBadge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
