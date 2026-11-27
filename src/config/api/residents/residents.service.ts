import { axiosInstance } from '../axios.config'
import { http } from '../client'
import type {
  ActiveResidentOption,
  ResidentRecord,
  ResidentSearchOption,
  ResidentTableItem,
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
  getAll: async (): Promise<ResidentRecord[]> => {
    return http.get<ResidentRecord[]>('/api/v1/residents')
  },

  searchActive: async (search?: string): Promise<ResidentSearchOption[]> => {
    try {
      return await http.get<ResidentSearchOption[]>('/api/v1/residents/search-active', {
        params: search ? { search } : {},
      })
    } catch {
      return []
    }
  },

  getTable: async (search?: string): Promise<ResidentTableItem[]> => {
    try {
      return await http.get<ResidentTableItem[]>('/api/v1/residents/table', {
        params: search ? { search } : {},
      })
    } catch {
      return []
    }
  },

  getById: async (id: string | number): Promise<ResidentRecord> => {
    return http.get<ResidentRecord>(`/api/v1/residents/${id}`)
  },

  getDetails: async (id: string | number): Promise<any> => {
    try {
      return await http.get(`/api/v1/residents/${id}/details`)
    } catch {
      return null
    }
  },

  create: async (data: Partial<ResidentRecord>): Promise<ResidentRecord> => {
    return http.post<ResidentRecord>('/api/v1/residents', data)
  },

  update: async (
    id: string | number,
    data: Partial<ResidentRecord>,
  ): Promise<ResidentRecord> => {
    return http.put<ResidentRecord>(`/api/v1/residents/${id}`, data)
  },

  delete: async (id: string | number): Promise<void> => {
    return http.delete<void>(`/api/v1/residents/${id}`)
  },

  searchActiveResidents: async (query = ''): Promise<ActiveResidentOption[]> => {
    try {
      const response = await axiosInstance.get<ActiveResidentOption[]>(
        '/api/v1/residents/search-active',
        { params: { search: query } },
      )
      return Array.isArray(response.data) ? response.data : []
    } catch {
      return []
    }
  },

  /**
   * 1. GET /api/v1/residents/stats
   * Fetch Resident Management Dashboard statistics with Month-over-Month trend percentages.
   */
  getResidentStats: async (): Promise<ResidentStatsResponse> => {
    const response = await axiosInstance.get<ResidentStatsResponse>(
      '/api/v1/residents/stats'
    )
    return response.data
  },

  /**
   * 2. GET /api/v1/residents/table
   * Fetch resident table list with search (Name or Barangay ID) and filters.
   */
  getResidentsTable: async (filter?: ResidentFilterRequest): Promise<ResidentTableResponse[]> => {
    const response = await axiosInstance.get<ResidentTableResponse[]>(
      '/api/v1/residents/table',
      { params: filter }
    )
    const data = response.data || []
    return [...data].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        const timeA = new Date(a.createdAt).getTime()
        const timeB = new Date(b.createdAt).getTime()
        if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
          return timeB - timeA
        }
      }
      return (b.id || 0) - (a.id || 0)
    })
  },

  /**
   * 3. GET /api/v1/residents/{id}/details
   * Fetch detailed resident profile.
   */
  getResidentDetail: async (id: number | string): Promise<ResidentDetailResponse> => {
    const response = await axiosInstance.get<ResidentDetailResponse>(
      `/api/v1/residents/${id}/details`
    )
    return response.data
  },

  /**
   * 4. POST /api/v1/residents
   * Create a new resident record.
   */
  createResident: async (data: ResidentCreateRequest): Promise<ResidentTableResponse> => {
    const response = await axiosInstance.post<ResidentTableResponse>(
      '/api/v1/residents',
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
      `/api/v1/residents/${id}`,
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
      `/api/v1/residents/${id}/status`,
      data
    )
    return response.data
  },

  /**
   * Archive a resident record.
   */
  archiveResident: async (id: number | string): Promise<ResidentTableResponse> => {
    const response = await axiosInstance.patch<ResidentTableResponse>(
      `/api/v1/residents/${id}/archive`
    )
    return response.data
  },

  /**
   * Restore an archived resident record back to active.
   */
  restoreResident: async (id: number | string): Promise<ResidentTableResponse> => {
    const response = await axiosInstance.patch<ResidentTableResponse>(
      `/api/v1/residents/${id}/restore`
    )
    return response.data
  },

  /**
   * DELETE /api/v1/residents/{id}
   * Remove or inactivate a resident record.
   */
  deleteResident: async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/v1/residents/${id}`)
  },

  /**
   * 8. GET /api/v1/residents/suggestions
   * Get next suggested Barangay ID and Household Number for new resident form.
   */
  getSuggestions: async (): Promise<ResidentSuggestionsResponse> => {
    const response = await axiosInstance.get<ResidentSuggestionsResponse>(
      '/api/v1/residents/suggestions'
    )
    return response.data
  },

  /**
   * 9. GET /api/v1/residents/relatives?lastName=xxx
   * Returns active residents sharing the same last name for family suggestion.
   */
  getRelativesByLastName: async (lastName: string): Promise<ResidentRelativeResponse[]> => {
    const response = await axiosInstance.get<ResidentRelativeResponse[]>(
      '/api/v1/residents/relatives',
      { params: { lastName } }
    )
    return response.data
  },
}
