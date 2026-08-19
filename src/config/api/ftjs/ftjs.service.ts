import { axiosInstance } from '@/config/api/axios.config'
import { ENDPOINTS } from '@/config/api/endpoints.config'
import type {
  FtjsRequestEntryPayload,
  FtjsResidentSearchResponse,
  FtjsStatsResponse,
  FtjsTableDTO,
  FtjsTableQueryParams,
  SpringPageResponse,
  ReIssuanceRequestDto,
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
      ENDPOINTS.FTJS.SEARCH_RESIDENT,
      { params: { query } }
    )
    return response.data
  },

  /**
   * Fetch specific FTJS resident profile by resident ID.
   */
  getResidentProfile: async (residentId: number): Promise<FtjsResidentSearchResponse> => {
    const response = await axiosInstance.get<FtjsResidentSearchResponse>(
      ENDPOINTS.FTJS.RESIDENT_PROFILE(residentId)
    )
    return response.data
  },

  /**
   * Submit new FTJS application entry with files.
   */
  createEntry: async (payload: FtjsRequestEntryPayload): Promise<FtjsResidentSearchResponse> => {
    const response = await axiosInstance.post<FtjsResidentSearchResponse>(
      ENDPOINTS.FTJS.ENTRY,
      payload
    )
    return response.data
  },

  /**
   * Fetch FTJS dashboard stats (total issued, issued this month, trend vs last month, original, re-issuances).
   */
  getStats: async (): Promise<FtjsStatsResponse> => {
    const response = await axiosInstance.get<FtjsStatsResponse>(ENDPOINTS.FTJS.STATS)
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
      ENDPOINTS.FTJS.SUMMARY,
      { params: cleanParams }
    )
    return response.data
  },

  /**
   * Fetch full FTJS record details by ID.
   */
  getFullDetails: async (ftjsId: number) => {
    const response = await axiosInstance.get(ENDPOINTS.FTJS.DETAIL(ftjsId))
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
      ENDPOINTS.FTJS.RE_ISSUANCE_REQUEST(ftjsId),
      payload
    )
    return response.data
  },

  // ── FTJS Detail View API Methods ───────────────────────────────────────────

  /**
   * Fetch detailed FTJS applicant record by FTJS ID.
   */
  getDetail: async (ftjsId: number): Promise<FtjsDetailResponse> => {
    const response = await axiosInstance.get<FtjsDetailResponse>(
      ENDPOINTS.FTJS.DETAIL(ftjsId)
    )
    return response.data
  },

  /**
   * Fetch FTJS timeline events by FTJS ID.
   */
  getTimeline: async (ftjsId: number): Promise<FtjsTimelineDto[]> => {
    const response = await axiosInstance.get<FtjsTimelineDto[]>(
      ENDPOINTS.FTJS.TIMELINE(ftjsId)
    )
    return response.data
  },

  /**
   * Fetch FTJS case notes by FTJS ID.
   */
  getNotes: async (ftjsId: number): Promise<FtjsNoteResponse[]> => {
    const response = await axiosInstance.get<FtjsNoteResponse[]>(
      ENDPOINTS.FTJS.NOTES_HISTORY(ftjsId)
    )
    return response.data
  },

  /**
   * Add a new note to an FTJS record.
   */
  addNote: async (ftjsId: number, note: string): Promise<FtjsNoteResponse> => {
    const response = await axiosInstance.post<FtjsNoteResponse>(
      ENDPOINTS.FTJS.NOTES_ENTRY(ftjsId),
      { note }
    )
    return response.data
  },

  /**
   * Fetch re-issuance history for an FTJS record.
   */
  getReIssuanceHistory: async (ftjsId: number): Promise<ReIssuanceHistoryDto[]> => {
    const response = await axiosInstance.get<ReIssuanceHistoryDto[]>(
      ENDPOINTS.FTJS.RE_ISSUANCE_HISTORY(ftjsId)
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
      ENDPOINTS.FTJS.ARCHIVE_STATS
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
      ENDPOINTS.FTJS.ARCHIVE_SUMMARY,
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
      ENDPOINTS.FTJS.TRASH_SUMMARY,
      { params: cleanParams }
    )
    return response.data
  },

  /**
   * Archive FTJS record.
   * POST /api/v1/ftjs/archive/{id}
   */
  archiveRecord: async (id: number) => {
    const response = await axiosInstance.post(ENDPOINTS.FTJS.ARCHIVE(id))
    return response.data
  },

  /**
   * Restore FTJS record from archive or trash.
   * POST /api/v1/ftjs/restore/{id}
   */
  restoreRecord: async (id: number) => {
    const response = await axiosInstance.post(ENDPOINTS.FTJS.RESTORE(id))
    return response.data
  },

  /**
   * Soft delete FTJS record (move to Recently Deleted trash).
   * DELETE /api/v1/ftjs/{id}
   */
  softDeleteRecord: async (id: number) => {
    const response = await axiosInstance.delete(ENDPOINTS.FTJS.SOFT_DELETE(id))
    return response.data
  },

  /**
   * Permanently delete single FTJS record from trash.
   * DELETE /api/v1/ftjs/trash/{id}/permanent
   */
  permanentDeleteRecord: async (id: number) => {
    const response = await axiosInstance.delete(ENDPOINTS.FTJS.PERMANENT_DELETE(id))
    return response.data
  },

  /**
   * Batch permanently delete multiple FTJS records from trash.
   * DELETE /api/v1/ftjs/trash/permanent/batch
   */
  batchPermanentDelete: async (ids: number[]) => {
    const response = await axiosInstance.delete(ENDPOINTS.FTJS.BATCH_PERMANENT_DELETE, {
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
      ENDPOINTS.FTJS.RETENTION_SETTING
    )
    return response.data
  },

  /**
   * Update retention timer setting.
   * PUT /api/v1/ftjs/update-retention
   */
  updateRetentionSetting: async (retentionPeriod: string) => {
    const response = await axiosInstance.put(
      ENDPOINTS.FTJS.UPDATE_RETENTION,
      { retentionPeriod }
    )
    return response.data
  },

  // ── FTJS Reports & Analytics API Methods ─────────────────────────────────

  getReportKpi: async (filters?: FtjsReportFilterParams): Promise<FtjsReportKpiResponse> => {
    const response = await axiosInstance.get<FtjsReportKpiResponse>(
      ENDPOINTS.FTJS.REPORTS_KPI,
      { params: filters }
    )
    return response.data
  },

  getTrendReport: async (filters?: FtjsReportFilterParams): Promise<TrendReportResponse> => {
    const response = await axiosInstance.get<TrendReportResponse>(
      ENDPOINTS.FTJS.TREND,
      { params: filters }
    )
    return response.data
  },

  getEducationDistribution: async (filters?: FtjsReportFilterParams): Promise<EducationDistributionResponse> => {
    const response = await axiosInstance.get<EducationDistributionResponse>(
      ENDPOINTS.FTJS.EDUCATION_DISTRIBUTION,
      { params: filters }
    )
    return response.data
  },

  getPurposeDistribution: async (filters?: FtjsReportFilterParams): Promise<PurposeDistributionResponse> => {
    const response = await axiosInstance.get<PurposeDistributionResponse>(
      ENDPOINTS.FTJS.PURPOSE_DISTRIBUTION,
      { params: filters }
    )
    return response.data
  },

  getIssuanceTypeDistribution: async (filters?: FtjsReportFilterParams): Promise<IssuanceTypeDistributionResponse> => {
    const response = await axiosInstance.get<IssuanceTypeDistributionResponse>(
      ENDPOINTS.FTJS.ISSUANCE_DISTRIBUTION,
      { params: filters }
    )
    return response.data
  },

  getReportTable: async (
    filters?: FtjsReportFilterParams & { search?: string; page?: number; size?: number }
  ): Promise<SpringPageResponse<FtjsReportTableItemDto>> => {
    const response = await axiosInstance.get<SpringPageResponse<FtjsReportTableItemDto>>(
      ENDPOINTS.FTJS.REPORTS_TABLE,
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
      ENDPOINTS.FTJS.DASHBOARD_STATS
    )
    return response.data
  },

}