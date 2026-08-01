import { axiosInstance } from '../axios.config'
import { ENDPOINTS } from '../endpoints.config'
import type {
  ResidentTableResponse,
  ResidentDetailResponse,
  ResidentStatsResponse,
  ResidentFilterRequest,
  ResidentCreateRequest,
  ResidentUpdateRequest,
  ResidentStatusUpdateRequest,
  ResidentSuggestionsResponse,
  ResidentRelativeResponse,
} from './residents.types'

export const residentService = {
  /**
   * 1. GET /api/v1/residents/stats
   * Fetch Resident Management Dashboard statistics with Month-over-Month trend percentages.
   */
  getResidentStats: async (): Promise<ResidentStatsResponse> => {
    const response = await axiosInstance.get<ResidentStatsResponse>(
      ENDPOINTS.RESIDENTS.STATS
    )
    return response.data
  },

  /**
   * 2. GET /api/v1/residents/table
   * Fetch resident table list with search (Name or Barangay ID) and filters.
   */
  getResidentsTable: async (filter?: ResidentFilterRequest): Promise<ResidentTableResponse[]> => {
    const response = await axiosInstance.get<ResidentTableResponse[]>(
      ENDPOINTS.RESIDENTS.TABLE,
      { params: filter }
    )
    return response.data
  },

  /**
   * 3. GET /api/v1/residents/{id}/details
   * Fetch detailed resident profile.
   */
  getResidentDetail: async (id: number | string): Promise<ResidentDetailResponse> => {
    const response = await axiosInstance.get<ResidentDetailResponse>(
      ENDPOINTS.RESIDENTS.GET_DETAILS(id)
    )
    return response.data
  },

  /**
   * 4. POST /api/v1/residents
   * Create a new resident record.
   */
  createResident: async (data: ResidentCreateRequest): Promise<ResidentTableResponse> => {
    const response = await axiosInstance.post<ResidentTableResponse>(
      ENDPOINTS.RESIDENTS.BASE,
      data
    )
    return response.data
  },

  /**
   * 5. PUT /api/v1/residents/{id}
   * Update existing resident information.
   */
  updateResident: async (
    id: number | string,
    data: ResidentUpdateRequest
  ): Promise<ResidentTableResponse> => {
    const response = await axiosInstance.put<ResidentTableResponse>(
      ENDPOINTS.RESIDENTS.UPDATE(id),
      data
    )
    return response.data
  },

  /**
   * 6. PATCH /api/v1/residents/{id}/status
   * Update resident status (ACTIVE, INACTIVE, DECEASED, MOVED_OUT).
   */
  updateResidentStatus: async (
    id: number | string,
    data: ResidentStatusUpdateRequest
  ): Promise<ResidentTableResponse> => {
    const response = await axiosInstance.patch<ResidentTableResponse>(
      ENDPOINTS.RESIDENTS.UPDATE_STATUS(id),
      data
    )
    return response.data
  },

  /**
   * Archive a resident record.
   */
  archiveResident: async (id: number | string): Promise<ResidentTableResponse> => {
    const response = await axiosInstance.patch<ResidentTableResponse>(
      ENDPOINTS.RESIDENTS.ARCHIVE(id)
    )
    return response.data
  },

  /**
   * Restore an archived resident record back to active.
   */
  restoreResident: async (id: number | string): Promise<ResidentTableResponse> => {
    const response = await axiosInstance.patch<ResidentTableResponse>(
      ENDPOINTS.RESIDENTS.RESTORE(id)
    )
    return response.data
  },

  /**
   * DELETE /api/v1/residents/{id}
   * Remove or inactivate a resident record.
   */
  deleteResident: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.RESIDENTS.DELETE(id))
  },

  /**
   * 8. GET /api/v1/residents/suggestions
   * Get next suggested Barangay ID and Household Number for new resident form.
   */
  getSuggestions: async (): Promise<ResidentSuggestionsResponse> => {
    const response = await axiosInstance.get<ResidentSuggestionsResponse>(
      ENDPOINTS.RESIDENTS.SUGGESTIONS
    )
    return response.data
  },

  /**
   * 9. GET /api/v1/residents/relatives?lastName=xxx
   * Returns active residents sharing the same last name for family suggestion.
   */
  getRelativesByLastName: async (lastName: string): Promise<ResidentRelativeResponse[]> => {
    const response = await axiosInstance.get<ResidentRelativeResponse[]>(
      ENDPOINTS.RESIDENTS.RELATIVES,
      { params: { lastName } }
    )
    return response.data
  },
}
