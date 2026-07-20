import { ENDPOINTS } from "@/constants/api";
import { http } from "@/lib/axios";
import { toApiError } from "@/lib/base-query";
import { session } from "@/lib/session";
import type {
  ChangePasswordInput,
  SignInInput,
  SignUpInput,
  SignUpResult,
  UpdateProfileInput,
} from "@/types/auth";
import type { ApiResponse } from "@/types/common";
import type { MeResponse } from "@/types/user";
import { baseApi } from "./base-api";

interface LoginResult {
  user: unknown;
  session: unknown;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<MeResponse, void>({
      query: () => ({ url: ENDPOINTS.ME }),
      providesTags: ["Me"],
    }),

    login: build.mutation<LoginResult, SignInInput>({
      async queryFn(input) {
        try {
          const res = await http.post<ApiResponse<LoginResult>>(
            ENDPOINTS.LOGIN,
            input,
          );
          if (!(await session.get())) {
            return {
              error: {
                status: 0,
                message:
                  "Signed in, but the session cookie could not be read from the response. " +
                  "Check that you're on a development build and the API is reachable over HTTPS.",
                fieldErrors: null,
              },
            };
          }
          return { data: res.data.data };
        } catch (err) {
          return { error: toApiError(err) };
        }
      },
      invalidatesTags: ["Me"],
    }),

    register: build.mutation<SignUpResult, SignUpInput>({
      query: (input) => ({
        url: ENDPOINTS.REGISTER,
        method: "POST",
        data: input,
      }),
    }),

    logout: build.mutation<{ success: boolean; message: string }, void>({
      query: () => ({ url: ENDPOINTS.SIGN_OUT, method: "POST", raw: true }),
    }),

    requestPasswordReset: build.mutation<unknown, { email: string }>({
      query: ({ email }) => ({
        url: ENDPOINTS.REQUEST_PASSWORD_RESET,
        method: "POST",
        data: { email, redirectTo: "/reset-password" },
        raw: true,
      }),
    }),

    /** Same catch-all caveats as requestPasswordReset. */
    resendVerification: build.mutation<unknown, { email: string }>({
      query: ({ email }) => ({
        url: ENDPOINTS.SEND_VERIFICATION_EMAIL,
        method: "POST",
        data: { email, callbackURL: "/" },
        raw: true,
      }),
    }),

    updateProfile: build.mutation<unknown, UpdateProfileInput>({
      query: (input) => ({
        url: ENDPOINTS.PROFILE,
        method: "PATCH",
        data: {
          ...input,
          // PATCH validates dateOfBirth with z.string().datetime() — a STRICT
          // ISO-8601 datetime. The plain "2000-01-15" that register happily
          // accepts is a 400 here.
          ...(input.dateOfBirth
            ? { dateOfBirth: new Date(input.dateOfBirth).toISOString() }
            : {}),
        },
      }),
      invalidatesTags: ["Me"],
    }),

    changePassword: build.mutation<null, ChangePasswordInput>({
      query: (input) => ({
        url: ENDPOINTS.PROFILE,
        method: "POST",
        data: input,
      }),
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRequestPasswordResetMutation,
  useResendVerificationMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;
