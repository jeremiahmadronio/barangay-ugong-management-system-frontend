import { http } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { PageResponse, BlotterBackendResponse } from './blotter.api'
import type { SessionMinutes, SessionFollowUp } from './mediation.api'

export interface LuponTableRowResponse {
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
    | 'CFA_ISSUED'
    | string
  complainantFullName: string
  respondentFullName: string
  dateFiled: string
  dateReferred: string
}

export interface LuponStatsResponse {
  totalReferred: number
  totalReferredTrend: string
  activeConciliation: number
  successfullySettled: number
  cfaIssued: number
}

export interface LuponFilterParams {
  search?: string
  status?: string
  natureOfComplaint?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

export interface LuponRecord {
  id: string
  caseNo: string
  complainant: string
  respondent: string
  dateFiled: string
  dateReferred: string
  filingTypeLabel: string
  cycleCount: number
  isReopened: boolean
  latestActiveCaseId: number
  status:
    | 'Pending'
    | 'Under Mediation'
    | 'Under Conciliation'
    | 'On Going'
    | 'Settled'
    | 'Dismissed'
    | 'CFA Issued'
    | 'Withdrawn'
  rawStatus: string
}

export interface PanelAttendanceResponse {
  id?: number
  panelMemberId: number
  officerId?: number
  officerName: string
  position: 'CHAIRMAN' | 'SECRETARY' | 'MEMBER' | string
  isPresent: boolean
}

export interface ConciliationSession {
  id: number
  caseId: number
  hearingNumber: number
  hearingType?: 'MEDIATION' | 'CONCILIATION' | string
  sessionTitle?: string
  isConciliation?: boolean
  scheduledStart: string
  scheduledEnd: string
  venue: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'PENDING_MINUTES'
  notes?: string
  hasMinutes?: boolean
  minutes?: SessionMinutes
  followUps?: SessionFollowUp[]
  panelAttendances?: PanelAttendanceResponse[]
  createdAt: string
}

export interface ScheduleConciliationPayload {
  scheduledStart: string
  scheduledEnd: string
  venue?: string
  notes?: string
  presentPanelMemberIds?: number[]
}

export interface RecordConciliationMinutesPayload {
  complainantPresent?: boolean
  respondentPresent?: boolean
  hearingNotes?: string
  outcome?: 'SETTLED' | 'FAILED' | 'POSTPONED' | string
  settlementTerms?: string
  panelAttendance?: Record<number, boolean>
}

export const luponApi = {
  // Fetch paginated and filtered Lupon cases table
  getTable: async (
    params?: LuponFilterParams
  ): Promise<PageResponse<LuponTableRowResponse>> => {
    return http.get<PageResponse<LuponTableRowResponse>>(ENDPOINTS.LUPON.TABLE, {
      params,
    })
  },

  // Fetch summary KPI statistics for Lupon module
  getStats: async (): Promise<LuponStatsResponse> => {
    return http.get<LuponStatsResponse>(ENDPOINTS.LUPON.STATS)
  },

  // Fetch single case detail by ID (cases share underlying case model)
  getById: async (id: string | number): Promise<BlotterBackendResponse> => {
    return http.get<BlotterBackendResponse>(ENDPOINTS.BLOTTER.DETAIL(String(id)))
  },

  // Update status (e.g. UNDER_CONCILIATION -> SETTLED or CFA_ISSUED)
  updateStatus: async (
    id: string | number,
    status: string,
    remarks?: string
  ): Promise<BlotterBackendResponse> => {
    return http.patch<BlotterBackendResponse>(`/api/v1/blotter/${id}/status`, {
      status,
      remarks,
    })
  },

  // Get assigned Pangkat members for a case
  getPangkatMembers: async (caseId: string | number): Promise<PanelAttendanceResponse[]> => {
    return http.get<PanelAttendanceResponse[]>(ENDPOINTS.LUPON.PANGKAT(caseId))
  },

  // Get Conciliation Sessions with Pangkat attendances
  getConciliationSessions: async (caseId: string | number): Promise<ConciliationSession[]> => {
    return http.get<ConciliationSession[]>(ENDPOINTS.LUPON.CONCILIATION_SESSIONS(caseId))
  },

  // Schedule Conciliation session
  scheduleConciliation: async (
    caseId: string | number,
    payload: ScheduleConciliationPayload
  ): Promise<ConciliationSession> => {
    return http.post<ConciliationSession>(ENDPOINTS.LUPON.CONCILIATION_SESSIONS(caseId), payload)
  },

  // Cancel Conciliation session
  cancelConciliation: async (sessionId: string | number): Promise<ConciliationSession> => {
    return http.patch<ConciliationSession>(ENDPOINTS.LUPON.CANCEL_CONCILIATION(sessionId))
  },

  // Record Conciliation minutes
  recordMinutes: async (
    sessionId: string | number,
    payload: RecordConciliationMinutesPayload
  ): Promise<ConciliationSession> => {
    return http.post<ConciliationSession>(ENDPOINTS.LUPON.CONCILIATION_MINUTES(sessionId), payload)
  },

  // Add follow-up remark to conciliation session
  addFollowUp: async (
    sessionId: string | number,
    payload: { remarks: string }
  ): Promise<SessionFollowUp> => {
    return http.post<SessionFollowUp>(ENDPOINTS.LUPON.CONCILIATION_FOLLOWUP(sessionId), payload)
  },

  // Get follow-up remarks for conciliation session
  getFollowUps: async (sessionId: string | number): Promise<SessionFollowUp[]> => {
    return http.get<SessionFollowUp[]>(ENDPOINTS.LUPON.CONCILIATION_FOLLOWUP(sessionId))
  },

  // Extend Lupon conciliation period by 15 days (one-time allowable extension)
  extendCase: async (caseId: string | number, reason: string): Promise<BlotterBackendResponse> => {
    return http.post<BlotterBackendResponse>(ENDPOINTS.LUPON.EXTEND(caseId), { reason })
  },
}
