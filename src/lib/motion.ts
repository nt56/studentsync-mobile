import {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  FadeOutLeft,
  FadeOutUp,
  LinearTransition,
  ReduceMotion,
  ZoomIn,
} from "react-native-reanimated";

export const motion = {
  get up() {
    return FadeInUp.duration(240).reduceMotion(ReduceMotion.System);
  },
  get down() {
    return FadeInDown.duration(240).reduceMotion(ReduceMotion.System);
  },
  get right() {
    return FadeInRight.duration(240).reduceMotion(ReduceMotion.System);
  },
  get zoom() {
    return ZoomIn.duration(240).reduceMotion(ReduceMotion.System);
  },
  get exit() {
    return FadeOutUp.duration(160).reduceMotion(ReduceMotion.System);
  },
  get exitLeft() {
    return FadeOutLeft.duration(160).reduceMotion(ReduceMotion.System);
  },
  get layout() {
    return LinearTransition.duration(200).reduceMotion(ReduceMotion.System);
  },
};
