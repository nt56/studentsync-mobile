/** @type {import('tailwindcss').Config} */
// IMPORTANT: keep tailwindcss pinned to ^3.4.x. NativeWind 4's peer range is a loose
// ">3.3.0" but the real constraint comes from react-native-css-interop, whose peer is
// `tailwindcss: "~3"`. Installing tailwind 4 will break the build.
module.exports = {
  // Was scanning ./App.tsx and ./components/** — neither exists. All source is in src/.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Mirrors the web app's design tokens (app/globals.css) so the two clients
      // stay visually consistent. Values are space-separated RGB triplets so that
      // Tailwind's alpha modifiers (bg-primary/50) keep working.
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        "card-foreground": "rgb(var(--card-foreground) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-foreground": "rgb(var(--primary-foreground) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        "secondary-foreground":
          "rgb(var(--secondary-foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-foreground": "rgb(var(--accent-foreground) / <alpha-value>)",
        destructive: "rgb(var(--destructive) / <alpha-value>)",
        "destructive-foreground":
          "rgb(var(--destructive-foreground) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        "success-foreground": "rgb(var(--success-foreground) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        "warning-foreground": "rgb(var(--warning-foreground) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "10px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
