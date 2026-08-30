import { http } from '../client'

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
  scheduledStart: string   // ISO-8601 LocalDateTime
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

export const mediationApi = {
  /** GET /{caseId}/mediation */
  getSessions: (caseId: number | string): Promise<MediationSession[]> =>
    http.get<MediationSession[]>(`/api/v1/blotter/${caseId}/mediation`),

  /** POST /{caseId}/mediation */
  scheduleSession: (
    caseId: number | string,
    payload: ScheduleMediationPayload,
  ): Promise<MediationSession> =>
    http.post<MediationSession>(`/api/v1/blotter/${caseId}/mediation`, payload),

  /** PATCH /mediation/{sessionId}/cancel */
  cancelSession: (sessionId: number | string): Promise<MediationSession> =>
    http.patch<MediationSession>(`/api/v1/blotter/mediation/${sessionId}/cancel`, null),

  /** POST /mediation/{sessionId}/minutes */
  recordMinutes: (
    sessionId: number | string,
    payload: {
      complainantPresent: boolean
      respondentPresent: boolean
      hearingNotes: string
      outcome: 'SETTLED' | 'FAILED' | 'POSTPONED'
      settlementTerms?: string
    },
  ): Promise<MediationSession> =>
    http.post<MediationSession>(`/api/v1/blotter/mediation/${sessionId}/minutes`, payload),

  /** GET /mediation/{sessionId}/minutes */
  getMinutes: (sessionId: number | string): Promise<SessionMinutes> =>
    http.get<SessionMinutes>(`/api/v1/blotter/mediation/${sessionId}/minutes`),

  /** POST /mediation/{sessionId}/followup */
  addFollowUp: (
    sessionId: number | string,
    payload: { remarks: string },
  ): Promise<SessionFollowUp> =>
    http.post<SessionFollowUp>(`/api/v1/blotter/mediation/${sessionId}/followup`, payload),

  /** GET /mediation/{sessionId}/followup */
  getFollowUps: (sessionId: number | string): Promise<SessionFollowUp[]> =>
    http.get<SessionFollowUp[]>(`/api/v1/blotter/mediation/${sessionId}/followup`),
}
