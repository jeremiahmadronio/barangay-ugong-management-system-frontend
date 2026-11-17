import { axiosInstance } from '../axios.config'
import type {
  ArchiveSettingsResponse,
  ArchiveStatsResponse,
  ArchivedResident,
  ArchivedUser,
  ArchivedOfficer,
} from './archive.types'

export const archiveService = {
  getSettings: async (): Promise<ArchiveSettingsResponse> => {
    try {
      const res = await axiosInstance.get<ArchiveSettingsResponse>('/api/v1/system-admin/archive/settings')
      return res.data
    } catch {
      return { autoDeleteEnabled: true, deleteAfterDays: 30 }
    }
  },

  updateSettings: async (payload: { autoDeleteEnabled: boolean; deleteAfterDays: number }): Promise<ArchiveSettingsResponse> => {
    try {
      const res = await axiosInstance.put<ArchiveSettingsResponse>('/api/v1/system-admin/archive/settings', payload)
      return res.data
    } catch {
      return payload
    }
  },

  getStats: async (): Promise<ArchiveStatsResponse> => {
    try {
      const res = await axiosInstance.get<ArchiveStatsResponse>('/api/v1/system-admin/archive/stats')
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

  getTrashResidents: async (search?: string): Promise<ArchivedResident[]> => {
    try {
      const res = await axiosInstance.get<ArchivedResident[]>('/api/v1/archive-resident/trash/residents', { params: { search } })
      return res.data
    } catch {
      return []
    }
  },

  getTrashUsers: async (search?: string): Promise<ArchivedUser[]> => {
    try {
      const res = await axiosInstance.get<ArchivedUser[]>('/api/v1/system-admin/archive/trash/users', { params: { search } })
      return res.data
    } catch {
      return []
    }
  },

  getTrashOfficers: async (search?: string): Promise<ArchivedOfficer[]> => {
    try {
      const res = await axiosInstance.get<ArchivedOfficer[]>('/api/v1/archive/trash/officers', { params: { search } })
      return res.data
    } catch {
      return []
    }
  },

  getArchivedResidents: async (search?: string): Promise<ArchivedResident[]> => {
    try {
      const res = await axiosInstance.get<ArchivedResident[]>('/api/v1/archive-resident/residents', { params: { search } })
      return res.data
    } catch {
      return []
    }
  },

  restoreResident: async (id: number): Promise<void> => {
    try {
      await axiosInstance.put(`/api/v1/archive-resident/residents/${id}/restore`)
    } catch {
      // Fallback to ResidentController status update endpoint
      await axiosInstance.put(`/api/v1/resident/update-status/${id}`, { status: 'ACTIVE' })
    }
  },

  softDeleteResident: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/archive-resident/residents/${id}`)
    } catch {
      await axiosInstance.delete(`/api/v1/resident/delete/${id}`)
    }
  },

  deleteResidentPermanent: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/archive-resident/residents/${id}/permanent`)
    } catch {
      await axiosInstance.delete(`/api/v1/resident/delete/${id}`)
    }
  },

  getArchivedUsers: async (search?: string): Promise<ArchivedUser[]> => {
    try {
      const res = await axiosInstance.get<ArchivedUser[]>('/api/v1/system-admin/archive/users', { params: { search } })
      return res.data
    } catch {
      return []
    }
  },

  restoreUser: async (id: string): Promise<void> => {
    try {
      await axiosInstance.put(`/api/v1/system-admin/archive/users/${id}/restore`)
    } catch (e) {
      console.warn('Restore user endpoint notice:', e)
    }
  },

  softDeleteUser: async (id: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/system-admin/archive/users/${id}`)
    } catch (e) {
      console.warn('Soft delete user endpoint notice:', e)
    }
  },

  deleteUserPermanent: async (id: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/system-admin/archive/users/${id}/permanent`)
    } catch (e) {
      console.warn('Delete user endpoint notice:', e)
    }
  },

  getArchivedOfficers: async (search?: string): Promise<ArchivedOfficer[]> => {
    try {
      const res = await axiosInstance.get<ArchivedOfficer[]>('/api/v1/archive/officers', { params: { search } })
      return res.data
    } catch {
      return []
    }
  },

  restoreOfficer: async (id: number): Promise<void> => {
    try {
      await axiosInstance.put(`/api/v1/archive/officers/${id}/restore`)
    } catch (e) {
      console.warn('Restore officer endpoint notice:', e)
    }
  },

  softDeleteOfficer: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/archive/officers/${id}`)
    } catch (e) {
      console.warn('Soft delete officer endpoint notice:', e)
    }
  },

  deleteOfficerPermanent: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/archive/officers/${id}/permanent`)
    } catch (e) {
      console.warn('Delete officer endpoint notice:', e)
    }
  },
}
