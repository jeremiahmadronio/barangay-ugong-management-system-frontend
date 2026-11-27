import { axiosInstance } from '../axios.config'
import type {
  ArchiveStatsResponse,
  ArchivedResident,
  ArchivedUser,
  ArchivedOfficer,
  AdminDashboardData,
  BarangayAdminDashboardKpiResponse,
} from './admin.types'

export const adminDashboardService = {
  getStats: async (): Promise<AdminDashboardData> => {
    const response = await axiosInstance.get<AdminDashboardData>(
      '/api/v1/admin/dashboard/stats'
    )
    return response.data
  },
}

export const barangayAdminDashboardService = {
  getKpiStats: async (): Promise<BarangayAdminDashboardKpiResponse> => {
    try {
      const res = await axiosInstance.get<BarangayAdminDashboardKpiResponse>(
        '/api/v1/admin/dashboard/kpi'
      )
      return res.data
    } catch {
      return {
        totalUsers: 0,
        totalResidents: 0,
        totalOfficers: 0,
        servicesIssuedThisWeek: 0,
        departmentOverview: {
          blotter: 0,
          lupon: 0,
          bcpc: 0,
          vawc: 0,
          clearance: 0,
          ftjs: 0,
          totalWeeklyOperations: 0,
        },
      }
    }
  },
}

export const adminArchiveService = {
  getStats: async (): Promise<ArchiveStatsResponse> => {
    try {
      const res = await axiosInstance.get<ArchiveStatsResponse>(
        '/api/v1/system-users/archive/stats'
      )
      return res.data
    } catch {
      return {
        totalArchived: 0,
        totalArchivedResidents: 0,
        totalArchivedOfficers: 0,
        totalArchivedUsers: 0,
        totalDeleted: 0,
        totalDeletedResidents: 0,
        totalDeletedOfficers: 0,
        totalDeletedUsers: 0,
      }
    }
  },

  getArchivedResidents: async (search?: string): Promise<ArchivedResident[]> => {
    try {
      const res = await axiosInstance.get<ArchivedResident[]>(
        '/api/v1/archive-resident/residents',
        { params: { search } }
      )
      return res.data
    } catch {
      return []
    }
  },

  getTrashResidents: async (search?: string): Promise<ArchivedResident[]> => {
    try {
      const res = await axiosInstance.get<ArchivedResident[]>(
        '/api/v1/archive-resident/trash/residents',
        { params: { search } }
      )
      return res.data
    } catch {
      return []
    }
  },

  restoreResident: async (id: number): Promise<void> => {
    await axiosInstance.put(`/api/v1/archive-resident/residents/${id}/restore`)
  },

  softDeleteResident: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/archive-resident/residents/${id}`)
  },

  deleteResidentPermanent: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/archive-resident/residents/${id}/permanent`)
  },

  getArchivedUsers: async (search?: string): Promise<ArchivedUser[]> => {
    try {
      const res = await axiosInstance.get<ArchivedUser[]>(
        '/api/v1/system-users/archive/users',
        { params: { search } }
      )
      return res.data
    } catch {
      return []
    }
  },

  getTrashUsers: async (search?: string): Promise<ArchivedUser[]> => {
    try {
      const res = await axiosInstance.get<ArchivedUser[]>(
        '/api/v1/system-users/archive/trash/users',
        { params: { search } }
      )
      return res.data
    } catch {
      return []
    }
  },

  restoreUser: async (id: string | number): Promise<void> => {
    await axiosInstance.patch(`/api/v1/system-users/${id}/restore`)
  },

  softDeleteUser: async (id: string | number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/system-users/${id}`)
  },

  deleteUserPermanent: async (id: string | number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/system-users/${id}/permanent`)
  },

  getArchivedOfficers: async (search?: string): Promise<ArchivedOfficer[]> => {
    try {
      const res = await axiosInstance.get<ArchivedOfficer[]>(
        '/api/v1/archive-officer/officers',
        { params: { search } }
      )
      return res.data
    } catch {
      return []
    }
  },

  getTrashOfficers: async (search?: string): Promise<ArchivedOfficer[]> => {
    try {
      const res = await axiosInstance.get<ArchivedOfficer[]>(
        '/api/v1/archive-officer/trash/officers',
        { params: { search } }
      )
      return res.data
    } catch {
      return []
    }
  },

  restoreOfficer: async (id: number): Promise<void> => {
    await axiosInstance.put(`/api/v1/archive-officer/officers/${id}/restore`)
  },

  softDeleteOfficer: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/archive-officer/officers/${id}`)
  },

  deleteOfficerPermanent: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/archive-officer/officers/${id}/permanent`)
  },
}
