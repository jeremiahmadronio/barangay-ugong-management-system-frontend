import { axiosInstance } from '@/config/api/axios.config'
import { ENDPOINTS } from '@/config/api/endpoints.config'
import type { FtjsRequestEntryPayload, FtjsResidentSearchResponse } from './ftjs.types'

export const ftjsService = {
  /**
   * Search active residents for FTJS verification.
   * Returns demographics, issuance histories, and barangay case histories.
   */
  searchResidents: async (query: string): Promise<FtjsResidentSearchResponse[]> => {
    const response = await axiosInstance.get<FtjsResidentSearchResponse[]>(
      `${ENDPOINTS.FTJS}/search-resident`,
      { params: { query } }
    )
    return response.data
  },

  /**
   * Fetch specific FTJS resident profile by resident ID.
   */
  getResidentProfile: async (residentId: number): Promise<FtjsResidentSearchResponse> => {
    const response = await axiosInstance.get<FtjsResidentSearchResponse>(
      `${ENDPOINTS.FTJS}/resident/${residentId}`
    )
    return response.data
  },

  /**
   * Submit new FTJS application entry with files.
   */
  createEntry: async (payload: FtjsRequestEntryPayload): Promise<FtjsResidentSearchResponse> => {
    const response = await axiosInstance.post<FtjsResidentSearchResponse>(
      `${ENDPOINTS.FTJS}/entry`,
      payload
    )
    return response.data
  },
}
