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
      const res = await axiosInstance.get<ArchiveSettingsResponse>('/api/v1/archive/settings')
      return res.data
    } catch {
      return { autoDeleteEnabled: true, deleteAfterDays: 30 }
    }
  },

  updateSettings: async (payload: { autoDeleteEnabled: boolean; deleteAfterDays: number }): Promise<ArchiveSettingsResponse> => {
    try {
      const res = await axiosInstance.put<ArchiveSettingsResponse>('/api/v1/archive/settings', payload)
      return res.data
    } catch {
      return payload
    }
  },

  getStats: async (): Promise<ArchiveStatsResponse> => {
    try {
      const res = await axiosInstance.get<ArchiveStatsResponse>('/api/v1/archive/stats')
      return res.data
    } catch {
      return {
        totalArchived: 0,
        totalArchivedResidents: 0,
        totalArchivedOfficers: 0,
        totalArchivedUsers: 0,
      }
    }
  },

  getArchivedResidents: async (search?: string): Promise<ArchivedResident[]> => {
    try {
      const res = await axiosInstance.get<ArchivedResident[]>('/api/v1/archive/residents', { params: { search } })
      return res.data
    } catch {
      return []
    }
  },

  restoreResident: async (id: number): Promise<void> => {
    try {
      await axiosInstance.put(`/api/v1/archive/residents/${id}/restore`)
    } catch {
      // Fallback to ResidentController status update endpoint
      await axiosInstance.put(`/api/v1/resident/update-status/${id}`, { status: 'ACTIVE' })
    }
  },

  deleteResidentPermanent: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/archive/residents/${id}/permanent`)
    } catch {
      // Fallback to ResidentController delete endpoint
      await axiosInstance.delete(`/api/v1/resident/delete/${id}`)
    }
  },

  getArchivedUsers: async (search?: string): Promise<ArchivedUser[]> => {
    try {
      const res = await axiosInstance.get<ArchivedUser[]>('/api/v1/archive/users', { params: { search } })
      return res.data
    } catch {
      return []
    }
  },

  restoreUser: async (id: string): Promise<void> => {
    try {
      await axiosInstance.put(`/api/v1/archive/users/${id}/restore`)
    } catch (e) {
      console.warn('Restore user endpoint notice:', e)
    }
  },

  deleteUserPermanent: async (id: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/archive/users/${id}/permanent`)
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

  deleteOfficerPermanent: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/archive/officers/${id}/permanent`)
    } catch (e) {
      console.warn('Delete officer endpoint notice:', e)
    }
  },
}
