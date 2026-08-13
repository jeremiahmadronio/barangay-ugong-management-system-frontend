import { axiosInstance } from '@/config/api/axios.config'
import { ENDPOINTS } from '@/config/api/endpoints.config'
import type {
  FtjsRequestEntryPayload,
  FtjsResidentSearchResponse,
  FtjsStatsResponse,
  FtjsTableDTO,
  FtjsTableQueryParams,
  SpringPageResponse,
  RequestNewFtjsPayload,
} from './ftjs.types'

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

  /**
   * Fetch FTJS dashboard stats (total issued, issued this month, trend vs last month, original, re-issuances).
   */
  getStats: async (): Promise<FtjsStatsResponse> => {
    const response = await axiosInstance.get<FtjsStatsResponse>(`${ENDPOINTS.FTJS}/stats`)
    return response.data
  },

  /**
   * Fetch paginated & filtered FTJS summary table items.
   */
  getSummaryTable: async (params: FtjsTableQueryParams): Promise<SpringPageResponse<FtjsTableDTO>> => {
    const cleanParams: Record<string, unknown> = {}
    if (params.page !== undefined) cleanParams.page = params.page
    if (params.size !== undefined) cleanParams.size = params.size
    if (params.search && params.search.trim()) cleanParams.search = params.search.trim()
    if (params.status && params.status !== 'all') cleanParams.status = params.status
    if (params.purpose && params.purpose !== 'all') cleanParams.purpose = params.purpose
    if (params.issuanceCount && params.issuanceCount !== 'all') cleanParams.issuanceCount = params.issuanceCount

    const response = await axiosInstance.get<SpringPageResponse<FtjsTableDTO>>(
      `${ENDPOINTS.FTJS}/summary`,
      { params: cleanParams }
    )
    return response.data
  },

  /**
   * Fetch full FTJS record details by ID.
   */
  getFullDetails: async (ftjsId: number) => {
    const response = await axiosInstance.get(`${ENDPOINTS.FTJS}/view-full/${ftjsId}`)
    return response.data
  },

  /**
   * Submit re-issuance request for FTJS certificate.
   */
  requestNewFtjs: async (payload: RequestNewFtjsPayload) => {
    const response = await axiosInstance.post(`${ENDPOINTS.FTJS}/request-new`, payload)
    return response.data
  },

  /**
   * Toggle archive state for FTJS record.
   */
  toggleArchive: async (id: number, isArchived: boolean, remarks?: string) => {
    const response = await axiosInstance.patch(`${ENDPOINTS.FTJS}/update-status/${id}`, {
      isArchived,
      remarks: remarks || '',
    })
    return response.data
  },
}

