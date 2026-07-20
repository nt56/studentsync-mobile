import { useColorScheme } from "nativewind";

export const lightColors = {
  background: "#f8fafc",
  foreground: "#0f172a",
  card: "#ffffff",
  cardForeground: "#0f172a",
  primary: "#2563eb",
  primaryForeground: "#ffffff",
  secondary: "#f1f5f9",
  secondaryForeground: "#1e293b",
  muted: "#f1f5f9",
  mutedForeground: "#64748b",
  accent: "#eff4ff",
  accentForeground: "#1d4ed8",
  destructive: "#dc2626",
  destructiveForeground: "#ffffff",
  success: "#16a34a",
  warning: "#d97706",
  border: "#e2e8f0",
  input: "#e2e8f0",
} as const;

export type ThemeColors = Record<keyof typeof lightColors, string>;

export const darkColors: ThemeColors = {
  background: "#0b1220",
  foreground: "#e5eef9",
  card: "#111a2c",
  cardForeground: "#e5eef9",
  primary: "#60a5fa",
  primaryForeground: "#08111f",
  secondary: "#162033",
  secondaryForeground: "#e5eef9",
  muted: "#131d30",
  mutedForeground: "#94a3b8",
  accent: "#172554",
  accentForeground: "#bfdbfe",
  destructive: "#f87171",
  destructiveForeground: "#08111f",
  success: "#4ade80",
  warning: "#fbbf24",
  border: "#242c3b",
  input: "#283449",
};

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? darkColors : lightColors;
}
