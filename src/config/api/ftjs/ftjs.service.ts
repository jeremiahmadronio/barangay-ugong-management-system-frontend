import { axiosInstance } from '@/config/api/axios.config'
import type {
  FtjsRequestEntryPayload,
  FtjsResidentSearchResponse,
  FtjsStatsResponse,
  FtjsTableDTO,
  FtjsTableQueryParams,
  SpringPageResponse,
  ReIssuanceRequestDto,
  LinkedBlotterResponseDTO,
  FtjsDetailResponse,
  FtjsTimelineDto,
  FtjsNoteResponse,
  ReIssuanceHistoryDto,
  FtjsArchiveStatsResponse,
  FtjsArchiveTableItem,
  FtjsReportFilterParams,
  FtjsReportKpiResponse,
  TrendReportResponse,
  EducationDistributionResponse,
  PurposeDistributionResponse,
  IssuanceTypeDistributionResponse,
  FtjsReportTableItemDto,
  FtjsDashboardSummaryDto,
} from './ftjs.types'

export const ftjsService = {
  /**
   * Search active residents for FTJS verification.
   * Returns demographics, issuance histories, and barangay case histories.
   */
  searchResidents: async (query: string): Promise<FtjsResidentSearchResponse[]> => {
    const response = await axiosInstance.get<FtjsResidentSearchResponse[]>(
      '/api/v1/ftjs/search-resident',
      { params: { query } }
    )
    return response.data
  },

  /**
   * Fetch specific FTJS resident profile by resident ID.
   */
  getResidentProfile: async (residentId: number): Promise<FtjsResidentSearchResponse> => {
    const response = await axiosInstance.get<FtjsResidentSearchResponse>(
      `/api/v1/ftjs/resident/${residentId}`
    )
    return response.data
  },

  /**
   * Submit new FTJS application entry with files.
   */
  createEntry: async (payload: FtjsRequestEntryPayload): Promise<FtjsResidentSearchResponse> => {
    const response = await axiosInstance.post<FtjsResidentSearchResponse>(
      '/api/v1/ftjs/entry',
      payload
    )
    return response.data
  },

  /**
   * Fetch FTJS dashboard stats (total issued, issued this month, trend vs last month, original, re-issuances).
   */
  getStats: async (): Promise<FtjsStatsResponse> => {
    const response = await axiosInstance.get<FtjsStatsResponse>('/api/v1/ftjs/stats')
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
      '/api/v1/ftjs/summary',
      { params: cleanParams }
    )
    return response.data
  },

  /**
   * Fetch full FTJS record details by ID.
   */
  getFullDetails: async (ftjsId: number) => {
    const response = await axiosInstance.get(`/api/v1/ftjs/detail/${ftjsId}`)
    return response.data
  },

  /**
   * Submit re-issuance request for FTJS certificate.
   */
  createReIssuanceRequest: async (
    ftjsId: number,
    payload: ReIssuanceRequestDto
  ): Promise<ReIssuanceRequestDto> => {
    const response = await axiosInstance.post<ReIssuanceRequestDto>(
      `/api/v1/ftjs/re-issuance-request/${ftjsId}`,
      payload
    )
    return response.data
  },

  /**
   * Fetch linked Blotter clearance case for FTJS re-issuance.
   */
  getLinkedBlotter: async (ftjsId: number): Promise<LinkedBlotterResponseDTO | null> => {
    try {
      const response = await axiosInstance.get<LinkedBlotterResponseDTO>(
        `/api/v1/ftjs/linked-blotter/${ftjsId}`
      )
      return response.data || null
    } catch {
      return null
    }
  },

  // ── FTJS Detail View API Methods ───────────────────────────────────────────

  /**
   * Fetch detailed FTJS applicant record by FTJS ID.
   */
  getDetail: async (ftjsId: number): Promise<FtjsDetailResponse> => {
    const response = await axiosInstance.get<FtjsDetailResponse>(
      `/api/v1/ftjs/detail/${ftjsId}`
    )
    return response.data
  },

  /**
   * Fetch FTJS timeline events by FTJS ID.
   */
  getTimeline: async (ftjsId: number): Promise<FtjsTimelineDto[]> => {
    const response = await axiosInstance.get<FtjsTimelineDto[]>(
      `/api/v1/ftjs/${ftjsId}/timeline/`
    )
    return response.data
  },

  /**
   * Fetch FTJS case notes by FTJS ID.
   */
  getNotes: async (ftjsId: number): Promise<FtjsNoteResponse[]> => {
    const response = await axiosInstance.get<FtjsNoteResponse[]>(
      `/api/v1/ftjs/notes-history/${ftjsId}`
    )
    return response.data
  },

  /**
   * Add a new note to an FTJS record.
   */
  addNote: async (ftjsId: number, note: string): Promise<FtjsNoteResponse> => {
    const response = await axiosInstance.post<FtjsNoteResponse>(
      `/api/v1/ftjs/notes-entry/${ftjsId}`,
      { note }
    )
    return response.data
  },

  /**
   * Fetch re-issuance history for an FTJS record.
   */
  getReIssuanceHistory: async (ftjsId: number): Promise<ReIssuanceHistoryDto[]> => {
    const response = await axiosInstance.get<ReIssuanceHistoryDto[]>(
      `/api/v1/ftjs/${ftjsId}/re-issuances/history`
    )
    return response.data
  },

  // ── FTJS Archive & Trash API Methods (Serbisyoko-Web) ──────────────────────

  /**
   * Fetch archive KPI stats.
   * GET /api/v1/ftjs/archive/stats
   */
  getArchiveStats: async (): Promise<FtjsArchiveStatsResponse> => {
    const response = await axiosInstance.get<FtjsArchiveStatsResponse>(
      '/api/v1/ftjs/archive/stats'
    )
    return response.data
  },

  /**
   * Fetch paginated/filtered archived table items.
   * GET /api/v1/ftjs/archives/summary
   */
  getArchiveTable: async (params?: FtjsTableQueryParams): Promise<SpringPageResponse<FtjsArchiveTableItem>> => {
    const cleanParams: Record<string, unknown> = {}
    if (params?.page !== undefined) cleanParams.page = params.page
    if (params?.size !== undefined) cleanParams.size = params.size
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim()
    if (params?.status && params.status !== 'all') cleanParams.status = params.status
    if (params?.purpose && params.purpose !== 'all') cleanParams.purpose = params.purpose
    if (params?.issuanceCount && params.issuanceCount !== 'all') cleanParams.issuanceCount = params.issuanceCount

    const response = await axiosInstance.get<SpringPageResponse<FtjsArchiveTableItem>>(
      '/api/v1/ftjs/archives/summary',
      { params: cleanParams }
    )
    return response.data
  },

  /**
   * Fetch paginated/filtered recently deleted (trash) table items.
   * GET /api/v1/ftjs/trash/summary
   */
  getRecentlyDeletedTable: async (params?: FtjsTableQueryParams): Promise<SpringPageResponse<FtjsArchiveTableItem>> => {
    const cleanParams: Record<string, unknown> = {}
    if (params?.page !== undefined) cleanParams.page = params.page
    if (params?.size !== undefined) cleanParams.size = params.size
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim()
    if (params?.status && params.status !== 'all') cleanParams.status = params.status
    if (params?.purpose && params.purpose !== 'all') cleanParams.purpose = params.purpose
    if (params?.issuanceCount && params.issuanceCount !== 'all') cleanParams.issuanceCount = params.issuanceCount

    const response = await axiosInstance.get<SpringPageResponse<FtjsArchiveTableItem>>(
      '/api/v1/ftjs/trash/summary',
      { params: cleanParams }
    )
    return response.data
  },

  /**
   * Archive FTJS record.
   * POST /api/v1/ftjs/archive/{id}
   */
  archiveRecord: async (id: number) => {
    const response = await axiosInstance.post(`/api/v1/ftjs/archive/${id}`)
    return response.data
  },

  /**
   * Restore FTJS record from archive or trash.
   * POST /api/v1/ftjs/restore/{id}
   */
  restoreRecord: async (id: number) => {
    const response = await axiosInstance.post(`/api/v1/ftjs/restore/${id}`)
    return response.data
  },

  /**
   * Soft delete FTJS record (move to Recently Deleted trash).
   * DELETE /api/v1/ftjs/{id}
   */
  softDeleteRecord: async (id: number) => {
    const response = await axiosInstance.delete(`/api/v1/ftjs/${id}`)
    return response.data
  },

  /**
   * Permanently delete single FTJS record from trash.
   * DELETE /api/v1/ftjs/trash/{id}/permanent
   */
  permanentDeleteRecord: async (id: number) => {
    const response = await axiosInstance.delete(`/api/v1/ftjs/trash/${id}/permanent`)
    return response.data
  },

  /**
   * Batch permanently delete multiple FTJS records from trash.
   * DELETE /api/v1/ftjs/trash/permanent/batch
   */
  batchPermanentDelete: async (ids: number[]) => {
    const response = await axiosInstance.delete('/api/v1/ftjs/trash/permanent/batch', {
      data: ids,
    })
    return response.data
  },

  /**
   * Fetch retention timer setting.
   * GET /api/v1/ftjs/display-retention
   */
  getRetentionSetting: async (): Promise<{ retentionPeriod: string }> => {
    const response = await axiosInstance.get<{ retentionPeriod: string }>(
      '/api/v1/ftjs/display-retention'
    )
    return response.data
  },

  /**
   * Update retention timer setting.
   * PUT /api/v1/ftjs/update-retention
   */
  updateRetentionSetting: async (retentionPeriod: string) => {
    const response = await axiosInstance.put(
      '/api/v1/ftjs/update-retention',
      { retentionPeriod }
    )
    return response.data
  },

  // ── FTJS Reports & Analytics API Methods ─────────────────────────────────

  getReportKpi: async (filters?: FtjsReportFilterParams): Promise<FtjsReportKpiResponse> => {
    const response = await axiosInstance.get<FtjsReportKpiResponse>(
      '/api/v1/ftjs/reports/kpi',
      { params: filters }
    )
    return response.data
  },

  getTrendReport: async (filters?: FtjsReportFilterParams): Promise<TrendReportResponse> => {
    const response = await axiosInstance.get<TrendReportResponse>(
      '/api/v1/ftjs/trend',
      { params: filters }
    )
    return response.data
  },

  getEducationDistribution: async (filters?: FtjsReportFilterParams): Promise<EducationDistributionResponse> => {
    const response = await axiosInstance.get<EducationDistributionResponse>(
      '/api/v1/ftjs/education-distribution',
      { params: filters }
    )
    return response.data
  },

  getPurposeDistribution: async (filters?: FtjsReportFilterParams): Promise<PurposeDistributionResponse> => {
    const response = await axiosInstance.get<PurposeDistributionResponse>(
      '/api/v1/ftjs/purpose-distribution',
      { params: filters }
    )
    return response.data
  },

  getIssuanceTypeDistribution: async (filters?: FtjsReportFilterParams): Promise<IssuanceTypeDistributionResponse> => {
    const response = await axiosInstance.get<IssuanceTypeDistributionResponse>(
      '/api/v1/ftjs/issuance-distribution',
      { params: filters }
    )
    return response.data
  },

  getReportTable: async (
    filters?: FtjsReportFilterParams & { search?: string; page?: number; size?: number }
  ): Promise<SpringPageResponse<FtjsReportTableItemDto>> => {
    const response = await axiosInstance.get<SpringPageResponse<FtjsReportTableItemDto>>(
      '/api/v1/ftjs/reports/table',
      { params: filters }
    )
    return response.data
  },

  /**
   * Fetch aggregate FTJS dashboard summary stats.
   * GET /api/v1/ftjs/dashboard-stats
   */
  getDashboardSummaryStats: async (): Promise<FtjsDashboardSummaryDto> => {
    const response = await axiosInstance.get<FtjsDashboardSummaryDto>(
      '/api/v1/ftjs/dashboard-stats'
    )
    return response.data
  },

}