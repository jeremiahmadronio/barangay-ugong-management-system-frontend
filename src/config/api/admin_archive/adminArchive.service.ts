import { axiosInstance } from '../axios.config'
import { ENDPOINTS } from '../endpoints.config'
import type {
  ArchiveStatsResponse,
  ArchivedResident,
  ArchivedUser,
  ArchivedOfficer,
} from '../archive/archive.types'

export const adminArchiveService = {
  getStats: async (): Promise<ArchiveStatsResponse> => {
    try {
      const res = await axiosInstance.get<ArchiveStatsResponse>(ENDPOINTS.ADMIN.ARCHIVE.STATS)
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
      const res = await axiosInstance.get<ArchivedResident[]>(ENDPOINTS.ADMIN.ARCHIVE.RESIDENTS, {
        params: { search },
      })
      return res.data
    } catch {
      return []
    }
  },

  getTrashResidents: async (search?: string): Promise<ArchivedResident[]> => {
    try {
      const res = await axiosInstance.get<ArchivedResident[]>(ENDPOINTS.ADMIN.ARCHIVE.TRASH_RESIDENTS, {
        params: { search },
      })
      return res.data
    } catch {
      return []
    }
  },

  restoreResident: async (id: number): Promise<void> => {
    await axiosInstance.put(ENDPOINTS.ADMIN.ARCHIVE.RESTORE_RESIDENT(id))
  },

  softDeleteResident: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.ADMIN.ARCHIVE.DELETE_RESIDENT(id))
  },

  deleteResidentPermanent: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.ADMIN.ARCHIVE.DELETE_RESIDENT_PERMANENT(id))
  },

  getArchivedUsers: async (search?: string): Promise<ArchivedUser[]> => {
    try {
      const res = await axiosInstance.get<ArchivedUser[]>(ENDPOINTS.ADMIN.ARCHIVE.USERS, {
        params: { search },
      })
      return res.data
    } catch {
      return []
    }
  },

  getTrashUsers: async (search?: string): Promise<ArchivedUser[]> => {
    try {
      const res = await axiosInstance.get<ArchivedUser[]>(ENDPOINTS.ADMIN.ARCHIVE.TRASH_USERS, {
        params: { search },
      })
      return res.data
    } catch {
      return []
    }
  },

  restoreUser: async (id: string | number): Promise<void> => {
    await axiosInstance.patch(ENDPOINTS.ADMIN.ARCHIVE.RESTORE_USER(id))
  },

  softDeleteUser: async (id: string | number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.ADMIN.ARCHIVE.DELETE_USER(id))
  },

  deleteUserPermanent: async (id: string | number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.ADMIN.ARCHIVE.DELETE_USER_PERMANENT(id))
  },

  getArchivedOfficers: async (search?: string): Promise<ArchivedOfficer[]> => {
    try {
      const res = await axiosInstance.get<ArchivedOfficer[]>(ENDPOINTS.ADMIN.ARCHIVE.OFFICERS, {
        params: { search },
      })
      return res.data
    } catch {
      return []
    }
  },

  getTrashOfficers: async (search?: string): Promise<ArchivedOfficer[]> => {
    try {
      const res = await axiosInstance.get<ArchivedOfficer[]>(ENDPOINTS.ADMIN.ARCHIVE.TRASH_OFFICERS, {
        params: { search },
      })
      return res.data
    } catch {
      return []
    }
  },

  restoreOfficer: async (id: number): Promise<void> => {
    await axiosInstance.put(ENDPOINTS.ADMIN.ARCHIVE.RESTORE_OFFICER(id))
  },

  softDeleteOfficer: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.ADMIN.ARCHIVE.DELETE_OFFICER(id))
  },

  deleteOfficerPermanent: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.ADMIN.ARCHIVE.DELETE_OFFICER_PERMANENT(id))
  },
}
