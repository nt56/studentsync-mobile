import { createSlice } from "@reduxjs/toolkit";

export type AuthStatus =
  "idle" | "checking" | "authenticated" | "unauthenticated";

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
