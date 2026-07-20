import { useCallback, useEffect } from "react";
import { setUnauthorizedHandler } from "@/lib/axios";
import { session } from "@/lib/session";
import { useGetMeQuery, useLogoutMutation } from "@/store/api/auth-api";
import { baseApi } from "@/store/api/base-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  sessionCleared,
  sessionFound,
  sessionVerified,
} from "@/store/slices/auth-slice";
import { clearBookmarks } from "@/store/slices/bookmark-slice";
import type { ApiError } from "@/types/common";

/** Everything that must die when a session ends. */
function useDestroySession() {
  const dispatch = useAppDispatch();
  return useCallback(async () => {
    await session.clear();
    dispatch(sessionCleared());
    dispatch(clearBookmarks());
    // Wipe every cached response. Without this, the next account to sign in on
    // this device would briefly render the previous user's notifications,
    // bookmarks and registrations from cache.
    dispatch(baseApi.util.resetApiState());
  }, [dispatch]);
}

/**
 * Drives the auth gate. Mount exactly ONCE, in the root layout.
 *
 *   idle --cookie in SecureStore?--> checking --GET /api/users/me--> authenticated
 *        \--no cookie-------------> unauthenticated
 */
export function useAuthBootstrap() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const destroySession = useDestroySession();

  // A 401 from any request means the cookie is dead — bounce to sign-in.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void destroySession();
    });
    return () => setUnauthorizedHandler(null);
  }, [destroySession]);

  // Look for a persisted cookie exactly once, on launch.
  useEffect(() => {
    if (status !== "idle") return;
    let cancelled = false;
    void (async () => {
      const cookie = await session.get();
      if (cancelled) return;
      dispatch(cookie ? sessionFound() : sessionCleared());
    })();
    return () => {
      cancelled = true;
    };
  }, [status, dispatch]);

  // With a cookie in hand, prove it's still valid by fetching the profile.
  const { data, isError, error } = useGetMeQuery(undefined, {
    skip: status === "idle" || status === "unauthenticated",
  });

  useEffect(() => {
    if (data && status === "checking") dispatch(sessionVerified());
  }, [data, status, dispatch]);

  useEffect(() => {
    if (!isError || status !== "checking") return;

    if ((error as ApiError | undefined)?.status === 401) {
      // The axios interceptor already cleared the cookie; reflect it in state.
      dispatch(sessionCleared());
      return;
    }

    // Anything else (offline, 5xx) means we couldn't *verify* the session — not
    // that it's invalid. Don't destroy a good session over a flaky network: let
    // them in on the stored cookie. The server still authorizes every request,
    // and a genuine 401 will sign them out the moment one lands.
    dispatch(sessionVerified());
  }, [isError, error, status, dispatch]);

  return {
    status,
    /** False while we're still deciding — keep the splash screen up. */
    isReady: status === "authenticated" || status === "unauthenticated",
    isAuthenticated: status === "authenticated",
  };
}

/** Call after a successful login to kick off profile hydration. */
export function useSessionEstablished() {
  const dispatch = useAppDispatch();
  return useCallback(() => dispatch(sessionFound()), [dispatch]);
}

export function useSignOut() {
  const [logout, { isLoading }] = useLogoutMutation();
  const destroySession = useDestroySession();

  const signOut = useCallback(async () => {
    try {
      await logout().unwrap();
    } catch {
      // The user asked to leave. Even if the server call fails (offline, already
      // expired), tear down the local session anyway.
    } finally {
      await destroySession();
    }
  }, [logout, destroySession]);

  return { signOut, isSigningOut: isLoading };
}

/** The signed-in student. Cached and deduped — call it from anywhere. */
export function useMe() {
  const status = useAppSelector((s) => s.auth.status);
  return useGetMeQuery(undefined, {
    skip: status === "idle" || status === "unauthenticated",
  });
}
