/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^immer$": require.resolve("immer"),
    "^react-redux$": require.resolve("react-redux"),
  },
  modulePathIgnorePatterns: ["<rootDir>/.expo/", "<rootDir>/dist/"],
  testMatch: ["<rootDir>/__tests__/**/*.test.ts?(x)"],
};
