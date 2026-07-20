import { ENDPOINTS } from "@/constants/api";
import type { College } from "@/types/college";
import type { PaginatedResponse } from "@/types/common";
import type { StudentAnalytics } from "@/types/user";
import { baseApi } from "./base-api";

interface UploadResult {
  /** The Cloudinary secure_url. NOTE: the field is `filePath`, not `url`. */
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

    /**
     * Multipart upload. The backend caps files at 5 MB and accepts only
     * jpeg/png/webp/gif. Returns `filePath` — feed that straight into
     * updateProfile({ profileImage }), which validates it as a URL.
     */
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
        // React Native's FormData takes this {uri,name,type} shape, which isn't
        // a real Blob — hence the cast.
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
