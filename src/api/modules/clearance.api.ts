import { http } from '../client'

export interface TemplateOptionResponse {
  id: number
  certTitle: string
}

export interface BodySectionItem {
  id: string
  text: string
  isEditable?: boolean
}

export interface TemplateDetailResponse {
  id: number
  certTitle: string
  bodySections: BodySectionItem[] | string
  issueFields: string[] | string
  requiresPhoto: boolean
  requiresThumbmark: boolean
  validityMonths: number
  footerText: string
  isArchived: boolean
}

export interface ClearanceIssuanceHistoryItem {
  certNumber: string
  certTitle: string
  issuedAt: string
  status: string
}

export interface ClearanceCaseHistoryItem {
  caseNumber: string
  incidentNature: string
  role: string
  createdAt: string
  status: string
}

export interface ClearanceResidentSearchResponse {
  residentId: number
  personId?: number
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  fullName: string
  age?: number
  gender?: string
  civilStatus?: string
  contactNumber?: string
  completeAddress?: string
  birthDate?: string
  placeOfBirth?: string
  residencyDate?: string
  issuanceHistory: ClearanceIssuanceHistoryItem[]
  caseHistory: ClearanceCaseHistoryItem[]
}

export interface IssueClearancePayload {
  templateId: number
  personId?: number
  requestorName?: string
  fieldValues?: Record<string, unknown>
  orNumber?: string
  ctnNumber?: string
  remarks?: string
}

export interface IssueClearanceResult {
  success: boolean
  message: string
  certificateNumber: string
  issuedId: number
}

export interface ClearanceStatsResponse {
  totalIssued: number
  issuedThisMonth: number
  mostIssuedCert: string
  mostCommonPurpose: string
}

export interface IssuedCertificateHistoryItem {
  id: number
  certNumber: string
  templateId?: number
  certTitle: string
  orNumber?: string
  ctnNumber?: string
  purpose: string
  status: string
  expiryDate?: string
  createdAt: string
  issuingOfficerName?: string
  fieldValues?: Record<string, unknown>
}

export interface IssuedCertificateTableResponse {
  id: number
  certNumber: string
  templateId?: number
  certTitle: string
  personId?: number
  requestorName: string
  orNumber?: string
  ctnNumber?: string
  purpose: string
  status: string
  expiryDate?: string
  createdAt: string
  fieldValues?: Record<string, unknown>
  totalIssuances?: number
  history?: IssuedCertificateHistoryItem[]
}

export interface ClearanceOfficerSummary {
  id: number
  fullName: string
  username: string
  roleName?: string
  employeeId?: string
}

export interface ClearanceApplicantSummary {
  personId?: number
  residentId?: number
  firstName?: string
  middleName?: string
  lastName?: string
  suffix?: string
  fullName: string
  age?: number
  gender?: string
  civilStatus?: string
  contactNumber?: string
  email?: string
  completeAddress?: string
  birthDate?: string
  placeOfBirth?: string
  citizenship?: string
  occupation?: string
  barangayIdNumber?: string
  isResident: boolean
}

export interface IssuedCertificateDetailResponse {
  id: number
  certNumber: string
  templateId?: number
  certTitle: string
  templateCode?: string
  purpose: string
  orNumber?: string
  ctnNumber?: string
  amountPaid: number
  isFree: boolean
  signatoryName?: string
  signatoryPosition?: string
  status: string
  expiryDate?: string
  createdAt: string
  updatedAt?: string
  fieldValues?: Record<string, unknown>
  isArchived?: boolean
  archivedAt?: string
  archiveRemarks?: string
  issuingOfficer?: ClearanceOfficerSummary
  applicant?: ClearanceApplicantSummary
  totalIssuances: number
  history: IssuedCertificateHistoryItem[]
}

export const clearanceApi = {
  /**
   * Fetch dashboard KPI statistics for clearance issuance.
   */
  getStats: () =>
    http.get<ClearanceStatsResponse>('/api/v1/clearance/stats'),

  /**
   * Fetch filtered active issued certificates for the management table.
   */
  getIssuedCertificates: (params?: { search?: string; typeOfCert?: string; purpose?: string }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.typeOfCert && params.typeOfCert !== 'ALL') query.append('typeOfCert', params.typeOfCert)
    if (params?.purpose && params.purpose !== 'ALL') query.append('purpose', params.purpose)
    const qs = query.toString()
    return http.get<IssuedCertificateTableResponse[]>(`/api/v1/clearance/issued-certificates${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch full, exhaustive details of a single issued certificate by ID.
   */
  getIssuedCertificateById: (id: string | number) =>
    http.get<IssuedCertificateDetailResponse>(`/api/v1/clearance/issued-certificates/${id}`),

  /**
   * Fetch lightweight active clearance and certificate template options (id and certTitle).
   */
  getTemplateOptions: () =>
    http.get<TemplateOptionResponse[]>('/api/v1/clearance/template/options'),

  /**
   * Fetch full template details by ID for issuance form rendering.
   */
  getTemplateById: (id: number) =>
    http.get<TemplateDetailResponse>(`/api/v1/clearance/template/${id}`),

  /**
   * Search active residents for clearance issuance with demographics, previous clearances, and blotter/lupon/vawc/bcpc cases.
   */
  searchResidents: (query: string) =>
    http.get<ClearanceResidentSearchResponse[]>(
      `/api/v1/clearance/search-resident?query=${encodeURIComponent(query)}`
    ),

  /**
   * Fetch a single resident's unified clearance profile by Resident ID.
   */
  getResidentProfile: (residentId: number) =>
    http.get<ClearanceResidentSearchResponse>(`/api/v1/clearance/resident/${residentId}`),

  /**
   * Issue a clearance or certificate and write audit log.
   */
  issueClearance: (payload: IssueClearancePayload) =>
    http.post<IssueClearanceResult>('/api/v1/clearance/issue-clearance', payload),

  /**
   * Fetch real-time Clearance Operational Dashboard KPIs (Today, Month, Active, Top Cert).
   */
  getDashboardKpi: () =>
    http.get<ClearanceDashboardKpiResponse>('/api/v1/clearance/reports/dashboard/kpi'),

  /**
   * Fetch aggregate KPI statistics for Clearance Reports.
   */
  getReportKpi: (params?: { startDate?: string; endDate?: string; templateId?: number }) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    if (params?.templateId) query.append('templateId', String(params.templateId))
    const qs = query.toString()
    return http.get<ClearanceReportKpiResponse>(`/api/v1/clearance/reports/kpi${qs ? `?${qs}` : ''}`)
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
    return http.get<ClearanceDailyTrendResponse[]>(`/api/v1/clearance/reports/trend/daily${qs ? `?${qs}` : ''}`)
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
    return http.get<ClearanceMonthlyTrendResponse[]>(`/api/v1/clearance/reports/trend/monthly${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch Certificate Template Type distribution breakdown for Clearance Reports.
   */
  getTypeBreakdown: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    const qs = query.toString()
    return http.get<ClearanceTypeBreakdownResponse>(`/api/v1/clearance/reports/breakdown/types${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch Application Purpose distribution breakdown for Clearance Reports.
   */
  getPurposeBreakdown: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    const qs = query.toString()
    return http.get<ClearancePurposeBreakdownResponse>(`/api/v1/clearance/reports/breakdown/purposes${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch Lifecycle KPI metrics for Clearance Archive and Trash Vault.
   */
  getArchiveKpi: () =>
    http.get<ClearanceLifecycleKpiResponse>('/api/v1/clearance/archive/kpi'),

  /**
   * Fetch paginated archived certificates.
   */
  getArchivedCertificates: (params?: { search?: string; page?: number; size?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.page !== undefined) query.append('page', String(params.page))
    if (params?.size !== undefined) query.append('size', String(params.size))
    const qs = query.toString()
    return http.get<ClearanceArchivePageResponse>(`/api/v1/clearance/archive/archived${qs ? `?${qs}` : ''}`)
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
    return http.get<ClearanceRecentDeletePageResponse>(`/api/v1/clearance/archive/trash${qs ? `?${qs}` : ''}`)
  },

  /**
   * Move an active certificate to archive.
   */
  archiveCertificate: (id: number, data?: { remarks?: string }) =>
    http.post<void>(`/api/v1/clearance/archive/${id}/archive`, data || {}),

  /**
   * Restore an archived certificate back to active list.
   */
  restoreArchivedCertificate: (id: number) =>
    http.post<void>(`/api/v1/clearance/archive/${id}/restore`),

  /**
   * Move a certificate to the recycle bin (soft delete).
   */
  softDeleteCertificate: (id: number) =>
    http.post<void>(`/api/v1/clearance/archive/${id}/soft-delete`),

  /**
   * Restore a soft-deleted certificate from the trash vault.
   */
  restoreDeletedCertificate: (id: number) =>
    http.post<void>(`/api/v1/clearance/archive/${id}/restore-trash`),

  /**
   * Permanently purge a certificate from the trash vault.
   */
  permanentDeleteCertificate: (id: number) =>
    http.delete<void>(`/api/v1/clearance/archive/${id}/permanent`),
}

export interface ClearanceArchiveItemResponse {
  id: number
  certNumber: string
  templateId?: number
  certTitle: string
  personId?: number
  requestorName: string
  orNumber?: string
  ctnNumber?: string
  purpose: string
  archiveRemarks: string
  status: string
  expiryDate?: string
  archivedAt: string
  createdAt: string
}

export interface ClearanceRecentDeleteItemResponse {
  id: number
  certNumber: string
  templateId?: number
  certTitle: string
  personId?: number
  requestorName: string
  orNumber?: string
  ctnNumber?: string
  purpose: string
  status: string
  expiryDate?: string
  deletedAt: string
  createdAt: string
}

export interface ClearanceArchivePageResponse {
  content: ClearanceArchiveItemResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

export interface ClearanceRecentDeletePageResponse {
  content: ClearanceRecentDeleteItemResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

export interface ClearanceLifecycleKpiResponse {
  totalArchived: number
  totalArchivedThisMonth: number
  totalRecentlyDeleted: number
  totalRecentlyDeletedThisMonth: number
}

export interface ClearanceReportKpiResponse {
  startDate: string
  endDate: string
  templateId?: number
  totalIssued: number
  mostIssuedCertName: string
  mostIssuedCertCount: number
  totalExpired: number
  maleCount: number
  femaleCount: number
  malePercentage: number
  femalePercentage: number
}

export interface ClearanceDailyTrendResponse {
  date: string
  label: string
  dayOfMonth: number
  totalIssued: number
}

export interface ClearanceMonthlyTrendResponse {
  monthLabel: string
  year: number
  month: number
  totalIssued: number
}

export interface ClearanceTypeBreakdownItem {
  certTitle: string
  count: number
  percentage: number
}

export interface ClearanceTypeBreakdownResponse {
  startDate: string
  endDate: string
  totalVolume: number
  breakdown: ClearanceTypeBreakdownItem[]
}

export interface ClearancePurposeBreakdownItem {
  purpose: string
  count: number
  percentage: number
}

export interface ClearancePurposeBreakdownResponse {
  startDate: string
  endDate: string
  totalVolume: number
  highestPurpose: string
  highestCount: number
  breakdown: ClearancePurposeBreakdownItem[]
}

export interface ClearanceDashboardKpiResponse {
  today: string
  weekStartDate: string
  weekEndDate: string
  totalIssuedToday: number
  totalIssuedThisWeek: number
  totalActiveClearances: number
  mostIssuedCertThisWeek: string
  mostIssuedCertCountThisWeek: number
}


