import { forwardRef } from "react";
import {
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type View,
} from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const NativePressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedPressable = forwardRef<
  View,
  PressableProps & { className?: string }
>(function AnimatedPressable({ onPressIn, onPressOut, style, ...props }, ref) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <NativePressable
      {...props}
      ref={ref}
      style={
        typeof style === "function"
          ? (state: PressableStateCallbackType) => [style(state), animatedStyle]
          : [style, animatedStyle]
      }
      onPressIn={(event) => {
        scale.value = withTiming(0.97, {
          duration: 100,
          reduceMotion: ReduceMotion.System,
        });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, {
          duration: 160,
          reduceMotion: ReduceMotion.System,
        });
        onPressOut?.(event);
      }}
    />
  );
});
