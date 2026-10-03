const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { validateEnvironment } = require("./scripts/check-env.cjs");

validateEnvironment(process.env);

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./src/app/global.css" });
