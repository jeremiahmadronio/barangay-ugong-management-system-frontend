import { http } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { TimelineEventResponse } from './blotter.api'

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

  getStats: async (): Promise<VawcBackendStats> => {
    return http.get<VawcBackendStats>(ENDPOINTS.VAWC.STATS)
  },

  getById: async (id: string | number): Promise<VawcCaseDetailResponse> => {
    return http.get<VawcCaseDetailResponse>(ENDPOINTS.VAWC.DETAIL(id))
  },

  create: async (data: VawcCaseCreateRequest): Promise<VawcCaseDetailResponse> => {
    return http.post<VawcCaseDetailResponse>(ENDPOINTS.VAWC.BASE, data)
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
}


