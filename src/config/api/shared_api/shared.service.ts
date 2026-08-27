import { axiosInstance } from '@/config/api/axios.config'
import { ENDPOINTS } from '@/config/api/endpoints.config'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Department {
  id: string | number
  name: string
  code?: string
}

export interface Permission {
  id: string | number
  name: string
  code?: string
  permissionName?: string
  category?: string
}

export interface PersonOption {
  id: number
  fullName: string
  contactNumber?: string
  completeAddress?: string
  personId?: number
}

export interface ActiveResidentOption {
  id: number
  personId?: number
  fullName: string
  barangayIdNumber?: string
  email?: string
  contactNumber?: string
  status?: string
  photoBase64?: string
}

export interface Role {
  id: string | number
  name: string
  code: string
  permissions?: Permission[]
}

export interface Purok {
  id: string | number
  name: string
}

export interface BarangayInfo {
  id: string | number
  name: string
  municipality?: string
  province?: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  lockedUsers: number
  totalBlotter: number
  totalLupon: number
  totalVawc: number
  totalBcpc: number
  totalClearanceIssued: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const sharedService = {
  /** All active departments directly from backend API (/api/v1/departments) */
  getDepartments: async (): Promise<Department[]> => {
    try {
      const response = await axiosInstance.get<Department[]>(ENDPOINTS.SHARED.DEPARTMENTS)
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },

  /** All system permissions directly from backend API (/api/v1/permissions) */
  getPermissions: async (): Promise<Permission[]> => {
    try {
      const response = await axiosInstance.get<Permission[]>(ENDPOINTS.SHARED.PERMISSIONS)
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },

  /** Search available residents / persons without accounts directly from backend API (/api/v1/persons/available-for-user) */
  searchAvailablePersons: async (query = ''): Promise<PersonOption[]> => {
    try {
      const response = await axiosInstance.get<PersonOption[]>(
        ENDPOINTS.SHARED.AVAILABLE_PERSONS,
        { params: { query } }
      )
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },

  /** Search active residents (status = ACTIVE) directly from backend API (/api/v1/residents/search-active) */
  searchActiveResidents: async (query = ''): Promise<ActiveResidentOption[]> => {
    try {
      const response = await axiosInstance.get<ActiveResidentOption[]>(
        ENDPOINTS.RESIDENTS.SEARCH_ACTIVE,
        { params: { search: query } }
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
      const response = await axiosInstance.get<boolean>(ENDPOINTS.SHARED.CHECK_EMAIL, {
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
      const response = await axiosInstance.get<Role[]>(ENDPOINTS.SHARED.ROLES)
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },

  /** Permissions by role code directly from backend API */
  getPermissionsByRole: async (roleCode: string): Promise<Permission[]> => {
    try {
      const response = await axiosInstance.get<Permission[]>(
        ENDPOINTS.SHARED.PERMISSIONS_BY_ROLE(roleCode)
      )
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },

  /** Barangay info directly from backend API */
  getBarangayInfo: async (): Promise<BarangayInfo> => {
    const response = await axiosInstance.get<BarangayInfo>(ENDPOINTS.SHARED.BARANGAY_INFO)
    return response.data
  },

  /** Puroks / Sitios directly from backend API */
  getPuroks: async (): Promise<Purok[]> => {
    const response = await axiosInstance.get<Purok[]>(ENDPOINTS.SHARED.PUROKS)
    return response.data
  },

  /** Overall dashboard summary stats directly from backend API */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await axiosInstance.get<DashboardStats>(ENDPOINTS.SHARED.DASHBOARD_STATS)
    return response.data
  },

  /** Fetch user department IDs & details directly from backend API (/api/v1/departments/user/{userId}) */
  getUserDepartments: async (userId: number | string): Promise<{ userId: number; departmentIds: number[]; departments: Department[] } | null> => {
    try {
      const response = await axiosInstance.get(`/api/v1/departments/user/${userId}`)
      return response.data
    } catch {
      return null
    }
  },
}
