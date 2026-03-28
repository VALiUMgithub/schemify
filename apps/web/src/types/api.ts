/**
 * Standard API response envelope returned by every backend endpoint.
 *
 * Example:
 *   { success: true, message: "Projects fetched", data: [...] }
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Paginated variant for list endpoints that support pagination.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
