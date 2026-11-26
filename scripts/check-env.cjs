const fs = require("node:fs");

const allowedPublicVariables = new Set([
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_KEY",
  // Optional: the old web-backend client. Removed in Phase 1.
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_PROJECT_ROOT",
]);

function validateOrigin(name, value, env) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Set ${name} to an HTTP(S) origin.`);
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(
      `${name} must be an HTTP(S) origin without credentials, path, query, or fragment.`,
    );
  }
  if (env.EAS_BUILD_PROFILE === "production" && url.protocol !== "https:") {
    throw new Error(`Production builds require an HTTPS ${name}.`);
  }
  return url.origin;
}

function validateEnvironment(env) {
  const unexpected = Object.keys(env).filter(
    (key) => key.startsWith("EXPO_PUBLIC_") && !allowedPublicVariables.has(key),
  );
  if (unexpected.length)
    throw new Error(
      `Unsupported public variables: ${unexpected.join(", ")}. Keep server credentials in the backend.`,
    );
  const origin = validateOrigin(
    "EXPO_PUBLIC_SUPABASE_URL",
    env.EXPO_PUBLIC_SUPABASE_URL,
    env,
  );
  // A secret or service_role key here would give every user full database access.
  if (!env.EXPO_PUBLIC_SUPABASE_KEY?.startsWith("sb_publishable_")) {
    throw new Error(
      "Set EXPO_PUBLIC_SUPABASE_KEY to the publishable key (sb_publishable_...). Never use a secret or service_role key.",
    );
  }
  if (env.EXPO_PUBLIC_API_URL) {
    validateOrigin("EXPO_PUBLIC_API_URL", env.EXPO_PUBLIC_API_URL, env);
  }
  return origin;
}

module.exports = { validateEnvironment };

if (require.main === module) {
  if (fs.existsSync(".env") && process.env.EXPO_NO_DOTENV !== "1")
    process.loadEnvFile(".env");
  try {
    validateEnvironment(process.env);
    console.log("Mobile environment is valid. No credentials were displayed.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
