import * as SecureStore from "expo-secure-store";
import { session } from "@/lib/session";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const setItem = SecureStore.setItemAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

/**
 * The whole app's auth hinges on pulling exactly the right substring out of a
 * Set-Cookie header, so this is the highest-leverage thing to test.
 */
describe("session.saveFromSetCookie", () => {
  it("extracts the plain (dev, http) session token", async () => {
    const ok = await session.saveFromSetCookie(
      "better-auth.session_token=abc.def; Path=/; HttpOnly; SameSite=Lax",
    );

    expect(ok).toBe(true);
    expect(setItem).toHaveBeenCalledWith(
      "ba_session_cookie",
      "better-auth.session_token=abc.def",
    );
  });

  it("handles the __Secure- prefix that production (https) uses", async () => {
    const ok = await session.saveFromSetCookie(
      "__Secure-better-auth.session_token=xyz.123; Path=/; Secure; HttpOnly",
    );

    expect(ok).toBe(true);
    expect(setItem).toHaveBeenCalledWith(
      "ba_session_cookie",
      "__Secure-better-auth.session_token=xyz.123",
    );
  });

  it("survives React Native joining multiple Set-Cookie headers with commas", async () => {
    // RN collapses repeated headers into one comma-separated string, so the
    // value must stop at the comma rather than swallowing the next cookie.
    const ok = await session.saveFromSetCookie(
      "__Secure-better-auth.session_token=tok.en; Path=/; Secure, " +
        "__Secure-better-auth.session_data=cached; Path=/; Secure",
    );

    expect(ok).toBe(true);
    expect(setItem).toHaveBeenCalledWith(
      "ba_session_cookie",
      "__Secure-better-auth.session_token=tok.en",
    );
  });

  it("accepts an array of Set-Cookie headers", async () => {
    const ok = await session.saveFromSetCookie([
      "better-auth.session_data=cached; Path=/",
      "better-auth.session_token=real.token; Path=/",
    ]);

    expect(ok).toBe(true);
    expect(setItem).toHaveBeenCalledWith(
      "ba_session_cookie",
      "better-auth.session_token=real.token",
    );
  });

  it("does NOT persist the session_data cache cookie", async () => {
    // We intentionally store only the token. session_data is a 5-minute cache we
    // can't keep fresh, so replaying a stale copy for a 7-day session is strictly
    // worse than letting the server do a real lookup.
    await session.saveFromSetCookie(
      "better-auth.session_token=t; Path=/, better-auth.session_data=cached; Path=/",
    );

    const stored = setItem.mock.calls[0][1] as string;
    expect(stored).not.toContain("session_data");
  });

  it("rejects the cookie-clearing value that sign-out sends", async () => {
    // Otherwise signing out would overwrite a good token with an empty one.
    expect(
      await session.saveFromSetCookie(
        'better-auth.session_token=""; Path=/; Max-Age=0',
      ),
    ).toBe(false);

    expect(
      await session.saveFromSetCookie(
        "better-auth.session_token=; Path=/; Max-Age=0",
      ),
    ).toBe(false);

    expect(setItem).not.toHaveBeenCalled();
  });

  it("returns false when there is no session cookie at all", async () => {
    expect(await session.saveFromSetCookie(undefined)).toBe(false);
    expect(await session.saveFromSetCookie(null)).toBe(false);
    expect(await session.saveFromSetCookie("some-other-cookie=1; Path=/")).toBe(
      false,
    );
    expect(setItem).not.toHaveBeenCalled();
  });
});
