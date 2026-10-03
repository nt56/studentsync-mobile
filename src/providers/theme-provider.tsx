import { darkColors, lightColors } from "@/lib/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, vars } from "nativewind";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Alert, View } from "react-native";

type Appearance = "system" | "light" | "dark";
const STORAGE_KEY = "studentsync.appearance";
const ThemeContext = createContext({
  appearance: "system" as Appearance,
  setAppearance: (_value: Appearance) => {},
});

function themeVariables(colors: typeof lightColors | typeof darkColors) {
  return vars(
    Object.fromEntries(
      Object.entries(colors).map(([key, value]) => {
        const name = key.replace(
          /[A-Z]/g,
          (letter) => `-${letter.toLowerCase()}`,
        );
        const rgb = [1, 3, 5]
          .map((offset) => parseInt(value.slice(offset, offset + 2), 16))
          .join(" ");
        return [`--${name}`, rgb];
      }),
    ),
  );
}

const lightVariables = themeVariables(lightColors);
const darkVariables = themeVariables(darkColors);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [applyColorScheme] = useState(() => setColorScheme);
  const [appearance, updateAppearance] = useState<Appearance>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark" || stored === "system") {
          updateAppearance(stored);
          applyColorScheme(stored);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [applyColorScheme]);

  function setAppearance(value: Appearance) {
    updateAppearance(value);
    setColorScheme(value);
    void AsyncStorage.setItem(STORAGE_KEY, value).catch(() => {
      Alert.alert(
        "Appearance changed",
        "Your preference couldn't be saved for the next launch.",
      );
    });
  }

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ appearance, setAppearance }}>
      <View
        style={[
          { flex: 1 },
          colorScheme === "dark" ? darkVariables : lightVariables,
        ]}
      >
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export const useAppearance = () => useContext(ThemeContext);
