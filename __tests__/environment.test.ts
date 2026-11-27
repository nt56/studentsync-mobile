const { validateEnvironment } = require("../scripts/check-env.cjs");

const valid = {
  EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  EXPO_PUBLIC_SUPABASE_KEY: "sb_publishable_test",
};

it("accepts a Supabase origin and normalizes its trailing slash", () => {
  expect(
    validateEnvironment({
      ...valid,
      EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
    }),
  ).toBe("https://example.supabase.co");
});

it("accepts the project root injected by Expo during Metro startup", () => {
  expect(
    validateEnvironment({
      ...valid,
      EXPO_PUBLIC_PROJECT_ROOT: "D:\\Projects\\student-sync",
    }),
  ).toBe("https://example.supabase.co");
});

it.each(["EXPO_PUBLIC_MONGODB_URI", "EXPO_PUBLIC_PROJECT_ROOT_SECRET"])(
  "still rejects %s when Expo's project root is present",
  (key) => {
    expect(() =>
      validateEnvironment({
        ...valid,
        EXPO_PUBLIC_PROJECT_ROOT: "D:\\Projects\\student-sync",
        [key]: "private-value",
      }),
    ).toThrow(key);
  },
);

it.each([
  "",
  "https://user:password@example.com",
  "https://example.com/rest/v1",
  "file:///tmp",
  "https://example.com?token=secret",
])("rejects unsafe or invalid origins", (url) => {
  expect(() =>
    validateEnvironment({ ...valid, EXPO_PUBLIC_SUPABASE_URL: url }),
  ).toThrow("EXPO_PUBLIC_SUPABASE_URL");
  if (url) {
    expect(() =>
      validateEnvironment({ ...valid, EXPO_PUBLIC_API_URL: url }),
    ).toThrow("EXPO_PUBLIC_API_URL");
  }
});

it.each([undefined, "", "sb_secret_private-value", "eyJprivate-value"])(
  "accepts only a publishable key, without printing %s",
  (key) => {
    let message = "";
    try {
      validateEnvironment({ ...valid, EXPO_PUBLIC_SUPABASE_KEY: key });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("EXPO_PUBLIC_SUPABASE_KEY");
    expect(message).not.toContain("private-value");
  },
);

it("rejects server credentials in public mobile configuration without printing their values", () => {
  let message = "";
  try {
    validateEnvironment({
      ...valid,
      EXPO_PUBLIC_MONGODB_URI: "private-value",
    });
  } catch (error) {
    message = (error as Error).message;
  }
  expect(message).toContain("EXPO_PUBLIC_MONGODB_URI");
  expect(message).not.toContain("private-value");
});

it("requires HTTPS for production", () => {
  expect(() =>
    validateEnvironment({
      ...valid,
      EAS_BUILD_PROFILE: "production",
      EXPO_PUBLIC_SUPABASE_URL: "http://example.com",
    }),
  ).toThrow("HTTPS");
});

it.each([
  ["http://127.0.0.1:54321", "http://127.0.0.1:54321"],
  ["http://10.0.2.2:54321", "http://10.0.2.2:54321"],
  ["http://192.168.1.20:54321/", "http://192.168.1.20:54321"],
])("accepts the local Supabase stack at %s outside production", (url, origin) => {
  expect(
    validateEnvironment({ ...valid, EXPO_PUBLIC_SUPABASE_URL: url }),
  ).toBe(origin);
});

it("refuses the local stack in a production build", () => {
  expect(() =>
    validateEnvironment({
      ...valid,
      EAS_BUILD_PROFILE: "production",
      EXPO_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    }),
  ).toThrow("HTTPS");
});
