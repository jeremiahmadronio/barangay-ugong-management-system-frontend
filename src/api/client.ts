import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiErrorResponse } from './types'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Format clean error messages
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    let message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred.'

    // Sanitize technical Jackson / Spring Boot deserialization and server errors
    if (typeof message === 'string') {
      if (
        message.includes('JSON parse error') ||
        message.includes('Cannot deserialize') ||
        message.includes('not one of the values accepted for Enum') ||
        message.includes('HttpMessageNotReadableException')
      ) {
        message = 'Invalid selection or format encountered in the form. Please check your selected values and try again.'
      } else if (
        message.includes('Internal Server Error') ||
        message.includes('NullPointerException') ||
        message.includes('org.springframework')
      ) {
        message = 'A server error occurred while processing the request. Please try again or contact support.'
      }
    }

    const formattedError: ApiErrorResponse = {
      success: false,
      message,
      status: error.response?.status,
    }

    return Promise.reject(new Error(formattedError.message))
  }
)

/**
 * Shared HTTP Helper Methods for clean API calls across features
 */
export const http = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(url, config)
    return response.data
  },

  post: async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config)
    return response.data
  },

  put: async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config)
    return response.data
  },

  patch: async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config)
    return response.data
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<T>(url, config)
    return response.data
  },

  upload: async <T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    })
    return response.data
  },
}
