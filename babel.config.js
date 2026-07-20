// NOTE: this file previously contained a copy of metro.config.js, which meant the
// NativeWind JSX transform never ran. NativeWind v4 needs both the `jsxImportSource`
// option on babel-preset-expo AND the nativewind/babel preset.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
