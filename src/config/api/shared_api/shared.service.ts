import { API_BASE_URL, axiosInstance } from '@/config/api/axios.config'
import type {
  BarangayInfo,
  DashboardStats,
  Department,
  PersonOption,
  Permission,
  Purok,
  Role,
  UserDepartmentsResponse,
} from './shared.types'

const resolveFileUrl = (url: string): string => {
  if (url.startsWith('http')) return url
  const baseUrl = (API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const resolveAssetUrl = (url?: string | null, fallback?: string): string => {
  const value = url?.trim() || fallback?.trim()
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value

  const path = value.startsWith('/') ? value : `/${value}`
  if (path === '/uploads' || path.startsWith('/uploads/')) {
    return resolveFileUrl(path)
  }
  if (path === '/test_logo2.png' || path === '/assets/test_logo2.png') {
    return '/assets/valenzuela-logo.png'
  }
  if (path === '/assets' || path.startsWith('/assets/')) return path

  return `/assets${path}`
}

export const sharedService = {
  /** All active departments directly from backend API (/api/v1/departments) */
  getDepartments: async (): Promise<Department[]> => {
    try {
      const response = await axiosInstance.get<Department[]>('/api/v1/departments')
      const list = Array.isArray(response.data) ? response.data : []
      return list.filter((dept) => {
        const upper = (dept.name || '').trim().toUpperCase()
        return !upper.includes('PEACE')
      })
    } catch {
      return []
    }
  },

  /** All system permissions directly from backend API (/api/v1/permissions) */
  getPermissions: async (): Promise<Permission[]> => {
    try {
      const response = await axiosInstance.get<Permission[]>('/api/v1/permissions')
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },

  /** Search available residents / persons without accounts directly from backend API (/api/v1/persons/available-for-user) */
  searchAvailablePersons: async (query = ''): Promise<PersonOption[]> => {
    try {
      const response = await axiosInstance.get<PersonOption[]>(
        '/api/v1/persons/available-for-user',
        { params: { query } }
      )
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },

  /** Check if a system email address is already taken by an active user */
  checkEmailAvailability: async (email: string): Promise<boolean> => {
    if (!email || !email.trim()) return false
    try {
      const response = await axiosInstance.get<boolean>('/api/v1/users/check-email', {
        params: { email: email.trim() },
      })
      return Boolean(response.data)
    } catch {
      return false
    }
  },

  /** All available roles directly from backend API */
  getRoles: async (): Promise<Role[]> => {
    try {
      const response = await axiosInstance.get<Role[]>('/api/v1/shared/roles')
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },

  /** Permissions by role code directly from backend API */
  getPermissionsByRole: async (roleCode: string): Promise<Permission[]> => {
    try {
      const response = await axiosInstance.get<Permission[]>(
        `/api/v1/shared/permissions/${roleCode}`
      )
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },

  /** Barangay info directly from backend API */
  getBarangayInfo: async (): Promise<BarangayInfo> => {
    const response = await axiosInstance.get<BarangayInfo>('/api/v1/shared/barangay')
    return response.data
  },

  /** Puroks / Sitios directly from backend API */
  getPuroks: async (): Promise<Purok[]> => {
    const response = await axiosInstance.get<Purok[]>('/api/v1/shared/puroks')
    return response.data
  },

  /** Overall dashboard summary stats directly from backend API */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await axiosInstance.get<DashboardStats>('/api/v1/shared/stats')
    return response.data
  },

  /** Fetch user department IDs & details directly from backend API (/api/v1/departments/user/{userId}) */
  getUserDepartments: async (
    userId: number | string
  ): Promise<UserDepartmentsResponse | null> => {
    try {
      const response = await axiosInstance.get(`/api/v1/departments/user/${userId}`)
      return response.data
    } catch {
      return null
    }
  },

  resolveFileUrl,
  resolveAssetUrl,

  getFileData: async (url: string) => {
    return axiosInstance.get(resolveFileUrl(url))
  },

  getFileBlob: async (url: string) => {
    return axiosInstance.get(resolveFileUrl(url), { responseType: 'blob' })
  },
}
