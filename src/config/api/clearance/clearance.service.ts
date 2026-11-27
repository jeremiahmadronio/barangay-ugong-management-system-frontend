import { http } from '../client'
import type {
  ClearanceArchivePageResponse,
  ClearanceDashboardKpiResponse,
  ClearanceDailyTrendResponse,
  ClearanceLifecycleKpiResponse,
  ClearanceMonthlyTrendResponse,
  ClearancePurposeBreakdownResponse,
  ClearanceRecentDeletePageResponse,
  ClearanceReportKpiResponse,
  ClearanceResidentSearchResponse,
  ClearanceStatsResponse,
  ClearanceTypeBreakdownResponse,
  IssuedCertificateDetailResponse,
  IssuedCertificateTableResponse,
  IssueClearancePayload,
  IssueClearanceResult,
  TemplateDetailResponse,
  TemplateOptionResponse,
} from './clearance.types'

const CLEARANCE_API = '/api/v1/clearance'

export const clearanceService = {
  /**
   * Fetch dashboard KPI statistics for clearance issuance.
   */
  getStats: () =>
    http.get<ClearanceStatsResponse>(`${CLEARANCE_API}/stats`),

  /**
   * Fetch filtered active issued certificates for the management table.
   */
  getIssuedCertificates: (params?: { search?: string; typeOfCert?: string; purpose?: string }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.typeOfCert && params.typeOfCert !== 'ALL') query.append('typeOfCert', params.typeOfCert)
    if (params?.purpose && params.purpose !== 'ALL') query.append('purpose', params.purpose)
    const qs = query.toString()
    return http.get<IssuedCertificateTableResponse[]>(`${CLEARANCE_API}/issued-certificates${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch full, exhaustive details of a single issued certificate by ID.
   */
  getIssuedCertificateById: (id: string | number) =>
    http.get<IssuedCertificateDetailResponse>(`${CLEARANCE_API}/issued-certificates/${id}`),

  /**
   * Fetch lightweight active clearance and certificate template options (id and certTitle).
   */
  getTemplateOptions: () =>
    http.get<TemplateOptionResponse[]>(`${CLEARANCE_API}/template/options`),

  /**
   * Fetch full template details by ID for issuance form rendering.
   */
  getTemplateById: (id: number) =>
    http.get<TemplateDetailResponse>(`${CLEARANCE_API}/template/${id}`),

  /**
   * Search active residents for clearance issuance with demographics, previous clearances, and blotter/lupon/vawc/bcpc cases.
   */
  searchResidents: (query: string) =>
    http.get<ClearanceResidentSearchResponse[]>(
      `${CLEARANCE_API}/search-resident?query=${encodeURIComponent(query)}`
    ),

  /**
   * Fetch a single resident's unified clearance profile by Resident ID.
   */
  getResidentProfile: (residentId: number) =>
    http.get<ClearanceResidentSearchResponse>(`${CLEARANCE_API}/resident/${residentId}`),

  /**
   * Issue a clearance or certificate and write audit log.
   */
  issueClearance: (payload: IssueClearancePayload) =>
    http.post<IssueClearanceResult>(`${CLEARANCE_API}/issue-clearance`, payload),

  /**
   * Fetch real-time Clearance Operational Dashboard KPIs (Today, Month, Active, Top Cert).
   */
  getDashboardKpi: () =>
    http.get<ClearanceDashboardKpiResponse>(`${CLEARANCE_API}/reports/dashboard/kpi`),

  /**
   * Fetch aggregate KPI statistics for Clearance Reports.
   */
  getReportKpi: (params?: { startDate?: string; endDate?: string; templateId?: number }) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    if (params?.templateId) query.append('templateId', String(params.templateId))
    const qs = query.toString()
    return http.get<ClearanceReportKpiResponse>(`${CLEARANCE_API}/reports/kpi${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch daily trend metrics for Clearance Reports.
   */
  getDailyTrend: (params?: { startDate?: string; endDate?: string; templateId?: number }) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    if (params?.templateId) query.append('templateId', String(params.templateId))
    const qs = query.toString()
    return http.get<ClearanceDailyTrendResponse[]>(`${CLEARANCE_API}/reports/trend/daily${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch monthly trend metrics for Clearance Reports.
   */
  getMonthlyTrend: (params?: { startDate?: string; endDate?: string; templateId?: number }) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    if (params?.templateId) query.append('templateId', String(params.templateId))
    const qs = query.toString()
    return http.get<ClearanceMonthlyTrendResponse[]>(`${CLEARANCE_API}/reports/trend/monthly${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch Certificate Template Type distribution breakdown for Clearance Reports.
   */
  getTypeBreakdown: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    const qs = query.toString()
    return http.get<ClearanceTypeBreakdownResponse>(`${CLEARANCE_API}/reports/breakdown/types${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch Application Purpose distribution breakdown for Clearance Reports.
   */
  getPurposeBreakdown: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    const qs = query.toString()
    return http.get<ClearancePurposeBreakdownResponse>(`${CLEARANCE_API}/reports/breakdown/purposes${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch Lifecycle KPI metrics for Clearance Archive and Trash Vault.
   */
  getArchiveKpi: () =>
    http.get<ClearanceLifecycleKpiResponse>(`${CLEARANCE_API}/archive/kpi`),

  /**
   * Fetch paginated archived certificates.
   */
  getArchivedCertificates: (params?: { search?: string; page?: number; size?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.page !== undefined) query.append('page', String(params.page))
    if (params?.size !== undefined) query.append('size', String(params.size))
    const qs = query.toString()
    return http.get<ClearanceArchivePageResponse>(`${CLEARANCE_API}/archive/archived${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch paginated recently deleted certificates in the trash vault.
   */
  getRecentDeletedCertificates: (params?: { search?: string; page?: number; size?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.page !== undefined) query.append('page', String(params.page))
    if (params?.size !== undefined) query.append('size', String(params.size))
    const qs = query.toString()
    return http.get<ClearanceRecentDeletePageResponse>(`${CLEARANCE_API}/archive/trash${qs ? `?${qs}` : ''}`)
  },

  /**
   * Move an active certificate to archive.
   */
  archiveCertificate: (id: number, data?: { remarks?: string }) =>
    http.post<void>(`${CLEARANCE_API}/archive/${id}/archive`, data || {}),

  /**
   * Restore an archived certificate back to active list.
   */
  restoreArchivedCertificate: (id: number) =>
    http.post<void>(`${CLEARANCE_API}/archive/${id}/restore`),

  /**
   * Move a certificate to the recycle bin (soft delete).
   */
  softDeleteCertificate: (id: number) =>
    http.post<void>(`${CLEARANCE_API}/archive/${id}/soft-delete`),

  /**
   * Restore a soft-deleted certificate from the trash vault.
   */
  restoreDeletedCertificate: (id: number) =>
    http.post<void>(`${CLEARANCE_API}/archive/${id}/restore-trash`),

  /**
   * Permanently purge a certificate from the trash vault.
   */
  permanentDeleteCertificate: (id: number) =>
    http.delete<void>(`${CLEARANCE_API}/archive/${id}/permanent`),
}
