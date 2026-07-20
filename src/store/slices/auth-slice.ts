import { createSlice } from "@reduxjs/toolkit";

/**
 * Only the auth *gate* lives here.
 *
 * The current user is deliberately NOT duplicated into Redux — it comes from
 * useGetMeQuery(), which is already cached and deduped, so there is a single
 * source of truth for profile data.
 *
 *   idle             app just launched; we haven't looked for a stored cookie yet
 *   checking         a cookie exists; validating it with GET /api/users/me
 *   authenticated    /me came back, the session is real
 *   unauthenticated  no cookie, a 401, or an explicit sign-out
 */
export type AuthStatus =
  | "idle"
  | "checking"
  | "authenticated"
  | "unauthenticated";

interface AuthState {
  status: AuthStatus;
}

const initialState: AuthState = { status: "idle" };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** A stored cookie was found on launch, or a fresh login just saved one. */
    sessionFound(state) {
      state.status = "checking";
    },
    /** GET /api/users/me succeeded — the cookie is valid. */
    sessionVerified(state) {
      state.status = "authenticated";
    },
    /** No cookie, the cookie was rejected (401), or the user signed out. */
    sessionCleared(state) {
      state.status = "unauthenticated";
    },
  },
});

export const { sessionFound, sessionVerified, sessionCleared } =
  authSlice.actions;

export default authSlice.reducer;
