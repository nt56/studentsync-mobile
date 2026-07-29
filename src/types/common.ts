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

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface ApiError {
  status: number;
  message: string;
  fieldErrors: Record<string, string[]> | null;
}
