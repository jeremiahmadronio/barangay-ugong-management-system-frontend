export interface CaseHistoryItemBackend {
  id: number
  caseNumber: string
  dateFiledFormatted: string
  status: string
  isCurrent?: boolean
  isPast?: boolean
  isLatestActive?: boolean
}

export interface BlotterTableRowResponse {
  rootCaseId: number
  rootCaseNumber: string
  latestActiveCaseId: number
  latestCaseNumber: string
  filingType: string
  cycleCount: number
  isReopened: boolean
  effectiveStatus:
    | 'PENDING'
    | 'UNDER_MEDIATION'
    | 'UNDER_CONCILIATION'
    | 'SETTLED'
    | 'IN_PROGRESS'
    | 'RESOLVED'
    | 'DISMISSED'
    | 'REOPENED'
  complainantFullName: string
  respondentFullName: string
  dateFiled: string
}

export interface BlotterBackendResponse {
  id: number
  caseNumber: string
  filingType: 'FORMAL_COMPLAINT' | 'FOR_RECORD_ONLY'
  caseStatus:
    | 'PENDING'
    | 'UNDER_MEDIATION'
    | 'UNDER_CONCILIATION'
    | 'SETTLED'
    | 'IN_PROGRESS'
    | 'RESOLVED'
    | 'DISMISSED'
  complainantName?: string
  complainantContact?: string
  complainantAddress?: string
  respondentName?: string
  respondentContact?: string
  respondentAddress?: string
  relationshipToComplainant?: string
  natureOfComplaint?: string
  dateOfIncident?: string
  timeOfIncident?: string
  incidentLocation?: string
  injuriesDamagesDescription?: string
  statementText?: string
  statementSummary?: string
  witnessCount?: number
  createdAt: string
  updatedAt: string
  dateFiledFormatted?: string
  rootCreatedAt?: string
  rootDateFiledFormatted?: string
  receivingOfficer?: string
  assignedOfficer?: string
  previousCaseNumber?: string
  reOpenedCaseNumber?: string
  rootCaseNumber?: string
  rootCaseId?: number
  caseHistory?: CaseHistoryItemBackend[]
  caseStatusRemarks?: string
  reopenRemarks?: string
  isExtended?: boolean
  extensionCount?: number
  extendedAt?: string
  extensionReason?: string
  extendedBy?: string
  complainant?: {
    id?: number
    firstName?: string
    lastName?: string
    middleName?: string
    fullName?: string
    contactNumber?: string
    completeAddress?: string
    age?: number | string
    gender?: string
    civilStatus?: string
    email?: string
  }
  respondent?: {
    id?: number
    firstName?: string
    lastName?: string
    middleName?: string
    fullName?: string
    contactNumber?: string
    completeAddress?: string
    relationshipToComplainant?: string
    currentlyLivingWithComplainant?: boolean
    age?: number | string
    gender?: string
    occupation?: string
  }
  incident?: {
    id?: number
    natureOfComplaint?: string
    dateOfIncident?: string
    timeOfIncident?: string
    placeOfIncident?: string
    frequencyOfIncident?: string
    descriptionOfInjuries?: string
    relatedBarangayService?: string
  }
  relatedBarangayService?: string
  ftjsApplicationId?: number
  ftjsCertificateNumber?: string
  documentReissuanceStatus?:
    | 'WAITING_FOR_BLOTTER'
    | 'PENDING_VERIFICATION'
    | 'APPROVED_FOR_REISSUANCE'
    | 'REJECTED'
    | 'COMPLETED'
  documentReissuanceRemarks?: string
  documentReissuanceReviewedBy?: string
  documentReissuanceReviewedAt?: string
  narrative?: {
    id?: number
    fileName?: string
    statementSummary?: string
    statementText?: string
    fileData?: string
  }
  evidence?: {
    id?: number
    evidenceTypeName?: string
    evidenceType?: string
    fileName?: string
    description?: string
    mediaPath?: string
    remarks?: string
    files?: string
  }
  evidences?: Array<{
    id?: number
    evidenceTypeName?: string
    evidenceType?: string
    fileName?: string
    description?: string
    mediaPath?: string
    remarks?: string
    files?: string
  }>
  witnesses?: Array<{
    id?: number
    firstName?: string
    lastName?: string
    fullName?: string
    contactNumber?: string
    completeAddress?: string
    address?: string
    testimonyText?: string
    hasTestimonyFile?: boolean
  }>
}

export interface BlotterBackendStats {
  totalCases: number
  totalCasesTrend: string
  totalForTheRecord: number
  totalForTheRecordTrend: string
  inProgressCases: number
  resolvedCases: number
  resolvedCasesTrend: string
}

export interface BlotterPaginatedResponse {
  content: (BlotterTableRowResponse | BlotterBackendResponse)[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

export interface RecentBlotterCaseResponse {
  id: number
  caseNumber: string
  complainantName: string
  respondentName: string
  filingType: 'FORMAL_COMPLAINT' | 'FOR_RECORD_ONLY'
  status: string
  createdAt: string
}

export interface QuickMediationSummaryDto {
  sessionId: number
  caseNumber: string
  partiesSummary: string
  summonNumber: number
  scheduledStart: string
  venue?: string
}

export interface SessionFollowUp {
  id?: number
  sessionId?: number
  remarks: string
  recordedBy?: string
  createdAt?: string
}

export interface SessionMinutes {
  id?: number
  sessionId?: number
  complainantPresent: boolean
  respondentPresent: boolean
  hearingNotes: string
  outcome: 'SETTLED' | 'FAILED' | 'POSTPONED'
  settlementTerms?: string
  createdAt?: string
}

export interface MediationSession {
  id: number
  caseId: number
  hearingNumber: number
  hearingType?: 'MEDIATION' | 'CONCILIATION' | string
  sessionTitle?: string
  scheduledStart: string
  scheduledEnd: string
  venue: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'PENDING_MINUTES'
  notes?: string
  hasMinutes?: boolean
  minutes?: SessionMinutes
  followUps?: SessionFollowUp[]
  createdAt: string
}

export interface ScheduleMediationPayload {
  scheduledStart: string
  scheduledEnd: string
  venue: string
  notes?: string
}

export interface RecordMediationMinutesPayload {
  complainantPresent: boolean
  respondentPresent: boolean
  hearingNotes: string
  outcome: 'SETTLED' | 'FAILED' | 'POSTPONED'
  settlementTerms?: string
}

export interface BlotterDashboardKpiResponse {
  weekStartDate: string
  weekEndDate: string
  totalNewCasesThisWeek: number
  totalPendingCases: number
  upcomingMediationsThisWeek: number
  totalUnresolvedCases: number
}

export interface BlotterReportKpiResponse {
  startDate: string
  endDate: string
  departmentId?: number
  totalCases: number
  settledCases: number
  settlementRate: number
  activeMediations: number
  luponReferrals: number
}

export interface MonthlyCaseTrendResponse {
  monthLabel: string
  year: number
  month: number
  totalCases: number
}

export interface DailyCaseTrendResponse {
  date: string
  label?: string
  dayLabel?: string
  dayOfMonth: number
  totalCases: number
}

export interface SettlementEfficiencyResponse {
  startDate: string
  endDate: string
  departmentId?: number
  totalCases: number
  totalFormalComplaints: number
  totalSettledCases: number
  settlementRate: number
}

export interface CaseStatusBreakdownResponse {
  startDate: string
  endDate: string
  departmentId?: number
  totalCases: number
  breakdown: Array<{
    status: string
    label: string
    count: number
    percentage: number
  }>
}

export interface FormalComplaintReportResponse {
  startDate: string
  endDate: string
  departmentId?: number
  totalFormalComplaints: number
  resolutionBreakdown?: {
    settledAtBlotter: number
    settledRate: number
    referredToLupon: number
    referredRate: number
    pendingAtBlotter: number
    pendingRate: number
  }
  breakdown?: {
    settledAtBlotter: number
    settledRate: number
    referredToLupon: number
    referredRate: number
    pendingAtBlotter: number
    pendingRate: number
  }
  overallSettlementRate: number
}

export interface CaseNoteResponse {
  id: number
  caseId: number
  note: string
  createdBy?: string
  createdAt: string
}

export interface TimelineEventResponse {
  id: number
  caseId: number
  eventType: string
  title: string
  description?: string
  performedBy?: string
  eventDate: string
}

export interface BlotterLifecycleKpiResponse {
  totalArchived: number
  totalArchivedThisMonth: number
  totalRecentlyDeleted: number
  totalRecentlyDeletedThisMonth: number
}

export interface BlotterArchiveItemResponse {
  id: number
  caseNumber: string
  complainantName: string
  respondentName: string
  archiveRemarks: string
  status: string
  archivedAt: string
  filingType: string
  classification?: string
}

export interface BlotterRecentDeleteItemResponse {
  id: number
  caseNumber: string
  complainantName: string
  respondentName: string
  status: string
  deletedAt: string
  filingType: string
  classification?: string
}

export interface BlotterArchiveFilterParams {
  search?: string
  filingType?: string
  page?: number
  size?: number
}

export interface PageResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  empty: boolean
}
