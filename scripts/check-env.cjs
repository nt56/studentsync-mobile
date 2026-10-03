const fs = require("node:fs");

const allowedPublicVariables = new Set([
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_PROJECT_ROOT",
]);

function validateEnvironment(env) {
  const unexpected = Object.keys(env).filter(
    (key) => key.startsWith("EXPO_PUBLIC_") && !allowedPublicVariables.has(key),
  );
  if (unexpected.length)
    throw new Error(
      `Unsupported public variables: ${unexpected.join(", ")}. Keep server credentials in the backend.`,
    );
  let url;
  try {
    url = new URL(env.EXPO_PUBLIC_API_URL);
  } catch {
    throw new Error(
      "Set EXPO_PUBLIC_API_URL to the StudentSync server origin.",
    );
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
      "EXPO_PUBLIC_API_URL must be an HTTP(S) origin without credentials, path, query, or fragment.",
    );
  }
  if (env.EAS_BUILD_PROFILE === "production" && url.protocol !== "https:") {
    throw new Error("Production builds require an HTTPS API origin.");
  }
  return url.origin;
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
