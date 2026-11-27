import type { SessionFollowUp, SessionMinutes } from '../blotter/blotter.types'

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
  settlementRate?: number
  cfaIssued: number
}

export interface LuponDashboardKpiResponse {
  weekStartDate: string
  weekEndDate: string
  totalReferredThisWeek: number
  totalUnderConciliation: number
  upcomingHearingsThisWeek: number
  totalCfaIssuedThisWeek: number
}

export interface LuponReportKpiResponse {
  startDate: string
  endDate: string
  totalReferred: number
  settledCases: number
  settlementRate: number
  activeConciliations: number
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
    | 'Certified to File Action'
    | 'Expired Unactioned'
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
