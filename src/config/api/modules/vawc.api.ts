import { http } from '../client'
import { ENDPOINTS } from '../endpoints'
import type {
  TimelineEventResponse,
  MonthlyCaseTrendResponse,
  DailyCaseTrendResponse,
  CaseStatusBreakdownResponse,
  BlotterLifecycleKpiResponse,
  BlotterArchiveItemResponse,
  BlotterRecentDeleteItemResponse,
  BlotterArchiveFilterParams,
  PageResponse,
} from '../blotter/blotter.types'

export interface VawcDashboardKpiResponse {
  weekStartDate: string
  weekEndDate: string
  totalCasesThisWeek: number
  totalCasesTrend?: string
  totalActiveBpoThisWeek: number
  totalReferredCasesThisWeek: number
  totalWithdrawnCasesThisWeek: number
}

export interface VawcReportKpiResponse {
  totalCases: number
  totalReferredCases: number
  mostReferredAgency: string
  mostReferredAgencyCount: number
  mostReferredAgencySuccessRate: number
  totalDismissedCases: number
  totalCasesTrend?: string
  totalReferredTrend?: string
  totalDismissedTrend?: string
}

export interface VawcAgencyReferralBreakdownResponse {
  agencyName: string
  totalReferrals: number
  percentage: number
  resolvedCount: number
  declinedCount: number
  pendingCount: number
  successRate: number
}

export interface VawcChildInvolved {
  id?: number
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  age?: number | string | null
  role?: string
}

export interface VawcWitness {
  id?: number
  firstName: string
  lastName: string
  contactNumber?: string
  completeAddress?: string
  testimonyFileName?: string
  testimonyFile?: string | null
}

export interface VawcEvidence {
  id?: number
  evidenceTypeName: string
  fileName?: string
  description?: string
  files?: string | null
}

export interface VawcCaseCreateRequest {
  caseNumber?: string
  assignedOfficerId?: number | null
  assignedOfficer?: string

  complainantId?: number | null
  complainant: {
    lastName: string
    firstName: string
    middleName?: string
    contactNumber?: string
    age?: number | string | null
    gender?: string
    civilStatus?: string
    email?: string
    completeAddress: string
  }

  respondentId?: number | null
  respondent: {
    lastName: string
    firstName: string
    middleName?: string
    contactNumber?: string
    age?: number | string | null
    gender?: string
    occupation?: string
    relationshipToComplainant: string
    completeAddress: string
    currentlyLivingWithComplainant?: boolean
  }

  incident: {
    natureOfComplaint: string
    dateOfIncident: string
    timeOfIncident?: string
    placeOfIncident: string
    frequencyOfIncident?: string
    descriptionOfInjuries?: string
  }

  violenceType?: string
  violenceTypeId?: number | null

  dangerAssessments?: string[]
  otherDangerAssessment?: string
  riskLevel?: string // LOW, MODERATE, HIGH-IMMINENT

  hasChildrenInvolved?: boolean
  children?: VawcChildInvolved[]

  filingMethod?: string // ORAL_REPORT_ONLY, WITH_WRITTEN_SWORN_STATEMENT
  filingType?: string // FORMAL_COMPLAINT, FOR_RECORD_ONLY

  narrative?: {
    fileName?: string
    statementSummary?: string
    fileData?: string | null
  }

  evidence?: VawcEvidence
  evidences?: VawcEvidence[]
  otherEvidenceDescription?: string
  witnesses?: VawcWitness[]

  immediateRequests?: string[]
}

export interface BpoDetailDto {
  id?: number
  bpoControlNumber?: string
  status?: string
  activatedAt?: string
  expiredAt?: string
  servedBy?: string
  dateServed?: string
  serviceMethod?: string
  witness1Name?: string
  witness2Name?: string
  certificationFileName?: string
  certificationFileData?: string
  certificationOfServiceFileData?: string
}

export interface BpoServeRequest {
  servedBy: string
  dateServed: string
  serviceMethod: string
  witness1Name?: string
  witness2Name?: string
  certificationFileName?: string
  certificationFileData?: string
}

export interface VawcCaseDetailResponse {
  id: number
  caseNumber: string
  filingType: string
  caseStatus: string
  caseStatusRemarks?: string
  dateFiledFormatted?: string
  dateFiled?: string
  assignedOfficerId?: number
  assignedOfficer?: string
  assignedOfficerName?: string
  complainant?: any
  respondent?: any
  incident?: any
  violenceType?: string
  narrative?: any
  evidence?: any
  evidences?: any[]
  witnesses?: any[]
  children?: any[]
  riskLevel?: string
  dangerAssessments?: string
  immediateRequests?: string
  bpo?: BpoDetailDto | null
  createdAt?: string
  updatedAt?: string
}

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      const base64String = result.includes(',') ? result.split(',')[1] : result
      resolve(base64String)
    }
    reader.onerror = (error) => reject(error)
  })

export interface VawcBackendStats {
  totalCases: number
  totalCasesTrend: string
  totalReferredCases: number
  totalActiveBpo: number
  totalWithdrawnCases: number
}

export interface VawcTableRowResponse {
  id: number
  caseNumber: string
  complainant: string
  respondent: string
  natureOfComplaint: string
  status: string
  riskLevel: string
  dateFiled: string
  createdAt?: string
}

export interface VawcFilterParams {
  search?: string
  status?: string
  riskLevel?: string
  page?: number
  size?: number
}

export interface VawcPaginatedResponse {
  content: VawcTableRowResponse[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

export interface VawcCaseNoteResponse {
  id: number
  caseId: number
  note: string
  createdBy: string
  createdAt: string
}

export interface VawcReferralCreateRequest {
  referredTo: string
  subjectOfLitigations?: string
  grounds?: string
  referredBy?: string
  referralDate?: string
}

export interface VawcReferralFeedbackRequest {
  details: string
  resolvesCase?: boolean
  resolutionType?: string
  proofFileName?: string
  proofFileData?: string
  declinedByAgency?: boolean
  reasonForDecline?: string
}

export interface ReferralFeedbackDto {
  id?: number
  details?: string
  resolvesCase?: boolean
  resolutionType?: string
  proofFileName?: string
  proofFileData?: string
  declinedByAgency?: boolean
  reasonForDecline?: string
  createdAt?: string
}

export interface VawcReferralResponse {
  id?: number
  caseId?: number
  caseNumber?: string
  referralControlNumber?: string
  referredTo: string
  subjectOfLitigations?: string
  grounds?: string
  status?: string
  referredBy?: string
  referralDate?: string
  feedback?: ReferralFeedbackDto | null
  createdAt?: string
}

export const vawcApi = {
  getAll: async (): Promise<VawcCaseDetailResponse[]> => {
    return http.get<VawcCaseDetailResponse[]>(ENDPOINTS.VAWC.BASE)
  },

  getTable: async (params?: VawcFilterParams): Promise<VawcPaginatedResponse> => {
    return http.get<VawcPaginatedResponse>(ENDPOINTS.VAWC.TABLE, { params })
  },

  getDashboardKpis: async (): Promise<VawcDashboardKpiResponse> => {
    return http.get<VawcDashboardKpiResponse>(ENDPOINTS.VAWC.DASHBOARD_KPI)
  },

  getStats: async (): Promise<VawcStatsResponse> => {
    return http.get<VawcBackendStats>(ENDPOINTS.VAWC.STATS)
  },

  getById: async (id: string | number): Promise<VawcCaseDetailResponse> => {
    return http.get<VawcCaseDetailResponse>(ENDPOINTS.VAWC.DETAIL(id))
  },

  create: async (data: VawcCaseCreateRequest): Promise<VawcCaseDetailResponse> => {
    return http.post<VawcCaseDetailResponse>(ENDPOINTS.VAWC.BASE, data)
  },

  updateCase: async (id: string | number, payload: any): Promise<VawcCaseDetailResponse> => {
    return http.put<VawcCaseDetailResponse>(`${ENDPOINTS.VAWC.BASE}/${id}`, payload)
  },

  updateStatus: async (
    id: string | number,
    status: string,
    remarks?: string
  ): Promise<VawcCaseDetailResponse> => {
    return http.patch<VawcCaseDetailResponse>(ENDPOINTS.VAWC.UPDATE_STATUS(id), { status, remarks })
  },

  getNotes: async (caseId: string | number): Promise<VawcCaseNoteResponse[]> => {
    return http.get<VawcCaseNoteResponse[]>(ENDPOINTS.VAWC.NOTES(caseId))
  },

  addNote: async (caseId: string | number, note: string): Promise<VawcCaseNoteResponse> => {
    return http.post<VawcCaseNoteResponse>(ENDPOINTS.VAWC.NOTES(caseId), { note })
  },

  getTimeline: async (caseId: string | number): Promise<TimelineEventResponse[]> => {
    return http.get<TimelineEventResponse[]>(ENDPOINTS.VAWC.TIMELINE(caseId))
  },

  activateBpo: async (caseId: string | number): Promise<VawcCaseDetailResponse> => {
    return http.post<VawcCaseDetailResponse>(ENDPOINTS.VAWC.ACTIVATE_BPO(caseId))
  },

  serveBpo: async (caseId: string | number, data: BpoServeRequest): Promise<VawcCaseDetailResponse> => {
    return http.post<VawcCaseDetailResponse>(ENDPOINTS.VAWC.SERVE_BPO(caseId), data)
  },

  createReferral: async (caseId: string | number, data: VawcReferralCreateRequest): Promise<VawcReferralResponse> => {
    return http.post<VawcReferralResponse>(ENDPOINTS.VAWC.REFERRALS(caseId), data)
  },

  getReferrals: async (caseId: string | number): Promise<VawcReferralResponse[]> => {
    return http.get<VawcReferralResponse[]>(ENDPOINTS.VAWC.REFERRALS(caseId))
  },

  addReferralFeedback: async (
    caseId: string | number,
    referralId: string | number,
    data: VawcReferralFeedbackRequest
  ): Promise<VawcReferralResponse> => {
    return http.post<VawcReferralResponse>(ENDPOINTS.VAWC.REFERRAL_FEEDBACK(caseId, referralId), data)
  },

  getNarrativeFileUrl: (caseId: string | number) => ENDPOINTS.VAWC.NARRATIVE_FILE(caseId),
  getEvidenceFileUrl: (evidenceId: string | number) => ENDPOINTS.VAWC.EVIDENCE_FILE(evidenceId),
  getWitnessFileUrl: (witnessId: string | number) => ENDPOINTS.VAWC.WITNESS_FILE(witnessId),

  // Reports & Analytics Endpoints
  getReportKpi: async (startDate?: string, endDate?: string): Promise<VawcReportKpiResponse> => {
    return http.get<VawcReportKpiResponse>(ENDPOINTS.VAWC.REPORTS_KPI, {
      params: { startDate, endDate },
    })
  },

  getAgencyReferralBreakdown: async (
    startDate?: string,
    endDate?: string
  ): Promise<VawcAgencyReferralBreakdownResponse[]> => {
    return http.get<VawcAgencyReferralBreakdownResponse[]>(ENDPOINTS.VAWC.REPORTS_AGENCY_REFERRALS, {
      params: { startDate, endDate },
    })
  },

  getMonthlyTrendReport: async (
    startDate?: string,
    endDate?: string
  ): Promise<MonthlyCaseTrendResponse[]> => {
    return http.get<MonthlyCaseTrendResponse[]>(ENDPOINTS.VAWC.REPORTS_MONTHLY_TREND, {
      params: { startDate, endDate },
    })
  },

  getDailyTrendReport: async (
    startDate?: string,
    endDate?: string
  ): Promise<DailyCaseTrendResponse[]> => {
    return http.get<DailyCaseTrendResponse[]>(ENDPOINTS.VAWC.REPORTS_DAILY_TREND, {
      params: { startDate, endDate },
    })
  },

  getStatusBreakdownReport: async (
    startDate?: string,
    endDate?: string
  ): Promise<CaseStatusBreakdownResponse> => {
    return http.get<CaseStatusBreakdownResponse>(ENDPOINTS.VAWC.REPORTS_STATUS_BREAKDOWN, {
      params: { startDate, endDate },
    })
  },

  getReportRecords: async (
    startDate?: string,
    endDate?: string
  ): Promise<VawcTableRowResponse[]> => {
    return http.get<VawcTableRowResponse[]>(ENDPOINTS.VAWC.REPORTS_RECORDS, {
      params: { startDate, endDate },
    })
  },

  // Archive & Trash Vault API Endpoints
  getArchiveKpi: async (): Promise<BlotterLifecycleKpiResponse> => {
    return http.get<BlotterLifecycleKpiResponse>(ENDPOINTS.VAWC.ARCHIVE_KPI)
  },

  getArchivedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterArchiveItemResponse>> => {
    return http.get<PageResponse<BlotterArchiveItemResponse>>(ENDPOINTS.VAWC.ARCHIVE_TABLE, { params })
  },

  getRecentDeletedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterRecentDeleteItemResponse>> => {
    return http.get<PageResponse<BlotterRecentDeleteItemResponse>>(ENDPOINTS.VAWC.RECENT_DELETE, { params })
  },

  archiveCase: async (id: string | number, remarks?: string): Promise<void> => {
    return http.patch<void>(ENDPOINTS.VAWC.ARCHIVE_CASE(id), { remarks: remarks || 'Archived Record' })
  },

  restoreArchivedCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(ENDPOINTS.VAWC.RESTORE_ARCHIVE(id))
  },

  softDeleteCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(ENDPOINTS.VAWC.SOFT_DELETE(id))
  },

  permanentDeleteCase: async (id: string | number): Promise<void> => {
    return http.delete<void>(ENDPOINTS.VAWC.PERMANENT_DELETE(id))
  },
}


