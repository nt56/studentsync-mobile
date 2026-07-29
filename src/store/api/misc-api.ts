import { ENDPOINTS } from "@/constants/api";
import type { College } from "@/types/college";
import type { PaginatedResponse } from "@/types/common";
import type { StudentAnalytics } from "@/types/user";
import { baseApi } from "./base-api";

interface UploadResult {
  filePath: string;
  fileName: string;
  publicId: string;
}

export const miscApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getColleges: build.query<
      PaginatedResponse<College>,
      { search?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: ENDPOINTS.COLLEGES, params }),
      providesTags: ["College"],
    }),

    getStudentAnalytics: build.query<StudentAnalytics, void>({
      query: () => ({ url: ENDPOINTS.ANALYTICS_STUDENT }),
      providesTags: ["Analytics"],
    }),

    uploadImage: build.mutation<
      UploadResult,
      {
        uri: string;
        name: string;
        type: string;
        category?: "profiles" | "events";
      }
    >({
      query: ({ uri, name, type, category = "profiles" }) => {
        const form = new FormData();
        form.append("file", { uri, name, type } as unknown as Blob);
        form.append("category", category);
        return {
          url: ENDPOINTS.UPLOAD,
          method: "POST",
          data: form,
          headers: { "Content-Type": "multipart/form-data" },
        };
      },
    }),
  }),
});

export const {
  useGetCollegesQuery,
  useGetStudentAnalyticsQuery,
  useUploadImageMutation,
} = miscApi;
