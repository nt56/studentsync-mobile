/** Every JSON endpoint wraps its payload: { success, message, data }. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/** List endpoints put the array under `items`, alongside `pagination`. */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

/** Normalized error surfaced by the RTK Query base query. */
export interface ApiError {
  status: number;
  /** From the backend's `{ success: false, message }` envelope. */
  message: string;
  /** From `errors`: a Record keyed by field path, e.g. { email: ["Invalid"] }. */
  fieldErrors: Record<string, string[]> | null;
}
