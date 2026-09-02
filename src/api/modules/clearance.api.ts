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
