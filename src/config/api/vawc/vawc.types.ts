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
