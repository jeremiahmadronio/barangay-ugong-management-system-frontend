import { axiosInstance } from '../axios.config'
import { ENDPOINTS } from '../endpoints.config'
import type {
  OfficerStatsResponse,
  OfficerTableResponse,
  OfficerFilterRequest,
  OfficerCreateRequest,
  OfficerUpdateRequest,
  OfficerStatusUpdateRequest,
  OfficerCaseHistoryResponse,
} from './officer.types'

export const officerService = {
  /**
   * GET /api/v1/officers/stats
   * Fetch Officer Management Dashboard statistics with MoM trend for total officers.
   */
  getOfficerStats: async (): Promise<OfficerStatsResponse> => {
    const response = await axiosInstance.get<OfficerStatsResponse>(ENDPOINTS.OFFICERS.STATS)
    return response.data
  },

  /**
   * GET /api/v1/officers/table
   * Fetch filtered officer directory table list.
   */
  getOfficersTable: async (filter?: OfficerFilterRequest): Promise<OfficerTableResponse[]> => {
    try {
      const response = await axiosInstance.get<OfficerTableResponse[]>(ENDPOINTS.OFFICERS.TABLE, {
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
    const response = await axiosInstance.post<OfficerTableResponse>(ENDPOINTS.OFFICERS.CREATE, data)
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
      ENDPOINTS.OFFICERS.UPDATE(id),
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
      ENDPOINTS.OFFICERS.UPDATE_STATUS(id),
      data
    )
    return response.data
  },

  /**
   * DELETE /api/v1/officers/{id}
   * Delete or archive an officer record.
   */
  deleteOfficer: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.OFFICERS.DELETE(id))
  },

  /**
   * GET /api/v1/officers/{id}/cases
   * Fetch all cases handled by the officer.
   */
  getOfficerCases: async (id: number | string): Promise<OfficerCaseHistoryResponse[]> => {
    try {
      const response = await axiosInstance.get<OfficerCaseHistoryResponse[]>(
        ENDPOINTS.OFFICERS.CASES(id)
      )
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },
}

