import type { ConfigContext, ExpoConfig } from "expo/config";

const { validateEnvironment } = require("./scripts/check-env.cjs") as {
  validateEnvironment: (env: Record<string, string | undefined>) => string;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  if (process.env.EXPO_PUBLIC_API_URL) validateEnvironment(process.env);
  return {
    ...config,
    name: config.name ?? "StudentSync",
    slug: config.slug ?? "student-synch-mobile",
  };
};
