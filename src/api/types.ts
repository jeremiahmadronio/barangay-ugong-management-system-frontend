/**
 * Shared API Response Wrappers & Common Interfaces
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data: T
  timestamp?: string
}

export interface PaginatedResponse<T = unknown> {
  content: T[]
  page: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface ApiErrorResponse {
  success: false
  message: string
  error?: string
  status?: number
  timestamp?: string
}

export interface QueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: unknown
}
