const { validateEnvironment } = require("../scripts/check-env.cjs");

it("accepts an API origin and normalizes its trailing slash", () => {
  expect(
    validateEnvironment({ EXPO_PUBLIC_API_URL: "https://example.com/" }),
  ).toBe("https://example.com");
});

it("accepts the project root injected by Expo during Metro startup", () => {
  expect(
    validateEnvironment({
      EXPO_PUBLIC_API_URL: "https://example.com",
      EXPO_PUBLIC_PROJECT_ROOT: "D:\\Projects\\student-sync",
    }),
  ).toBe("https://example.com");
});

it.each(["EXPO_PUBLIC_MONGODB_URI", "EXPO_PUBLIC_PROJECT_ROOT_SECRET"])(
  "still rejects %s when Expo's project root is present",
  (key) => {
    expect(() =>
      validateEnvironment({
        EXPO_PUBLIC_API_URL: "https://example.com",
        EXPO_PUBLIC_PROJECT_ROOT: "D:\\Projects\\student-sync",
        [key]: "private-value",
      }),
    ).toThrow(key);
  },
);

it.each([
  "",
  "https://user:password@example.com",
  "https://example.com/api",
  "file:///tmp",
  "https://example.com?token=secret",
])("rejects unsafe or invalid API configuration", (url) => {
  expect(() => validateEnvironment({ EXPO_PUBLIC_API_URL: url })).toThrow();
});

it("rejects server credentials in public mobile configuration without printing their values", () => {
  expect(() =>
    validateEnvironment({
      EXPO_PUBLIC_API_URL: "https://example.com",
      EXPO_PUBLIC_MONGODB_URI: "private-value",
    }),
  ).toThrow("EXPO_PUBLIC_MONGODB_URI");
});

it("requires HTTPS for production", () => {
  expect(() =>
    validateEnvironment({
      EAS_BUILD_PROFILE: "production",
      EXPO_PUBLIC_API_URL: "http://example.com",
    }),
  ).toThrow("HTTPS");
});
