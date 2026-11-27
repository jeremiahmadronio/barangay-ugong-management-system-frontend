import { axiosInstance } from '../axios.config'
import { http } from '../client'
import type {
  LuponOfficerOption,
  OfficerOption,
  OfficerStatsResponse,
  OfficerTableResponse,
  OfficerFilterRequest,
  OfficerCreateRequest,
  OfficerUpdateRequest,
  OfficerStatusUpdateRequest,
  OfficerCaseHistoryResponse,
} from './officer.types'

export const officerService = {
  getActiveOfficers: async (): Promise<OfficerOption[]> => {
    try {
      return await http.get<OfficerOption[]>('/api/v1/officers/table', {
        params: { status: 'ACTIVE' },
      })
    } catch {
      return []
    }
  },

  getLuponOfficers: async (): Promise<LuponOfficerOption[]> => {
    try {
      return await http.get<LuponOfficerOption[]>('/api/v1/officers/lupon')
    } catch {
      return []
    }
  },

  getOfficers: async (): Promise<OfficerOption[]> => {
    return officerService.getActiveOfficers()
  },

  /**
   * GET /api/v1/officers/stats
   * Fetch Officer Management Dashboard statistics with MoM trend for total officers.
   */
  getOfficerStats: async (): Promise<OfficerStatsResponse> => {
    const response = await axiosInstance.get<OfficerStatsResponse>('/api/v1/officers/stats')
    return response.data
  },

  /**
   * GET /api/v1/officers/table
   * Fetch filtered officer directory table list.
   */
  getOfficersTable: async (filter?: OfficerFilterRequest): Promise<OfficerTableResponse[]> => {
    try {
      const response = await axiosInstance.get<OfficerTableResponse[]>('/api/v1/officers/table', {
        params: filter,
      })
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },

  /**
   * POST /api/v1/officers
   * Register a new officer or staff member.
   */
  createOfficer: async (data: OfficerCreateRequest): Promise<OfficerTableResponse> => {
    const response = await axiosInstance.post<OfficerTableResponse>('/api/v1/officers', data)
    return response.data
  },

  /**
   * PUT /api/v1/officers/{id}
   * Update existing officer details.
   */
  updateOfficer: async (
    id: number | string,
    data: OfficerUpdateRequest
  ): Promise<OfficerTableResponse> => {
    const response = await axiosInstance.put<OfficerTableResponse>(
      `/api/v1/officers/${id}`,
      data
    )
    return response.data
  },

  /**
   * PATCH /api/v1/officers/{id}/status
   * Toggle or update officer status (ACTIVE / INACTIVE).
   */
  updateOfficerStatus: async (
    id: number | string,
    data: OfficerStatusUpdateRequest
  ): Promise<OfficerTableResponse> => {
    const response = await axiosInstance.patch<OfficerTableResponse>(
      `/api/v1/officers/${id}/status`,
      data
    )
    return response.data
  },

  /**
   * DELETE /api/v1/officers/{id}
   * Delete or archive an officer record.
   */
  deleteOfficer: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/v1/officers/${id}`)
  },

  /**
   * GET /api/v1/officers/{id}/cases
   * Fetch all cases handled by the officer.
   */
  getOfficerCases: async (id: number | string): Promise<OfficerCaseHistoryResponse[]> => {
    try {
      const response = await axiosInstance.get<OfficerCaseHistoryResponse[]>(
        `/api/v1/officers/${id}/cases`
      )
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },
}

