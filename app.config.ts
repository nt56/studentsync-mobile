import type { ConfigContext, ExpoConfig } from "expo/config";

const { validateEnvironment } = require("./scripts/check-env.cjs") as {
  validateEnvironment: (env: Record<string, string | undefined>) => string;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  // Skipped when unset so EAS metadata commands run without a local .env.
  if (
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_KEY
  ) {
    validateEnvironment(process.env);
  }
  return {
    ...config,
    name: config.name ?? "StudentSync",
    slug: config.slug ?? "student-synch-mobile",
  };
};
