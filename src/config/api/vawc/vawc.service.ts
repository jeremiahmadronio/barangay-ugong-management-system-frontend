import { http } from '../client'
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
import type {
  VawcCaseDetailResponse,
  VawcFilterParams,
  VawcPaginatedResponse,
  VawcDashboardKpiResponse,
  VawcBackendStats,
  VawcCaseCreateRequest,
  VawcCaseNoteResponse,
  BpoServeRequest,
  VawcReferralCreateRequest,
  VawcReferralResponse,
  VawcReferralFeedbackRequest,
  VawcReportKpiResponse,
  VawcAgencyReferralBreakdownResponse,
  VawcTableRowResponse,
} from './vawc.types'

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

export const vawcService = {
  getAll: async (): Promise<VawcCaseDetailResponse[]> => {
    return http.get<VawcCaseDetailResponse[]>('/api/v1/vawc')
  },

  getTable: async (params?: VawcFilterParams): Promise<VawcPaginatedResponse> => {
    return http.get<VawcPaginatedResponse>('/api/v1/vawc/table', { params })
  },

  getDashboardKpis: async (): Promise<VawcDashboardKpiResponse> => {
    return http.get<VawcDashboardKpiResponse>('/api/v1/vawc/dashboard-kpi')
  },

  getStats: async (): Promise<VawcBackendStats> => {
    return http.get<VawcBackendStats>('/api/v1/vawc/stats')
  },

  getById: async (id: string | number): Promise<VawcCaseDetailResponse> => {
    return http.get<VawcCaseDetailResponse>(`/api/v1/vawc/${id}`)
  },

  create: async (data: VawcCaseCreateRequest): Promise<VawcCaseDetailResponse> => {
    return http.post<VawcCaseDetailResponse>('/api/v1/vawc', data)
  },

  updateCase: async (id: string | number, payload: any): Promise<VawcCaseDetailResponse> => {
    return http.put<VawcCaseDetailResponse>(`/api/v1/vawc/${id}`, payload)
  },

  updateStatus: async (
    id: string | number,
    status: string,
    remarks?: string
  ): Promise<VawcCaseDetailResponse> => {
    return http.patch<VawcCaseDetailResponse>(`/api/v1/vawc/${id}/status`, { status, remarks })
  },

  getNotes: async (caseId: string | number): Promise<VawcCaseNoteResponse[]> => {
    return http.get<VawcCaseNoteResponse[]>(`/api/v1/vawc/${caseId}/notes`)
  },

  addNote: async (caseId: string | number, note: string): Promise<VawcCaseNoteResponse> => {
    return http.post<VawcCaseNoteResponse>(`/api/v1/vawc/${caseId}/notes`, { note })
  },

  getTimeline: async (caseId: string | number): Promise<TimelineEventResponse[]> => {
    return http.get<TimelineEventResponse[]>(`/api/v1/vawc/${caseId}/timeline`)
  },

  activateBpo: async (caseId: string | number): Promise<VawcCaseDetailResponse> => {
    return http.post<VawcCaseDetailResponse>(`/api/v1/vawc/${caseId}/bpo/activate`)
  },

  serveBpo: async (caseId: string | number, data: BpoServeRequest): Promise<VawcCaseDetailResponse> => {
    return http.post<VawcCaseDetailResponse>(`/api/v1/vawc/${caseId}/bpo/serve`, data)
  },

  createReferral: async (caseId: string | number, data: VawcReferralCreateRequest): Promise<VawcReferralResponse> => {
    return http.post<VawcReferralResponse>(`/api/v1/vawc/${caseId}/referrals`, data)
  },

  getReferrals: async (caseId: string | number): Promise<VawcReferralResponse[]> => {
    return http.get<VawcReferralResponse[]>(`/api/v1/vawc/${caseId}/referrals`)
  },

  addReferralFeedback: async (
    caseId: string | number,
    referralId: string | number,
    data: VawcReferralFeedbackRequest
  ): Promise<VawcReferralResponse> => {
    return http.post<VawcReferralResponse>(`/api/v1/vawc/${caseId}/referrals/${referralId}/feedback`, data)
  },

  getNarrativeFileUrl: (caseId: string | number) => `/api/v1/vawc/files/narrative/${caseId}`,
  getEvidenceFileUrl: (evidenceId: string | number) => `/api/v1/vawc/files/evidence/${evidenceId}`,
  getWitnessFileUrl: (witnessId: string | number) => `/api/v1/vawc/files/witness/${witnessId}`,

  // Reports & Analytics Endpoints
  getReportKpi: async (startDate?: string, endDate?: string): Promise<VawcReportKpiResponse> => {
    return http.get<VawcReportKpiResponse>('/api/v1/vawc/reports/kpi', {
      params: { startDate, endDate },
    })
  },

  getAgencyReferralBreakdown: async (
    startDate?: string,
    endDate?: string
  ): Promise<VawcAgencyReferralBreakdownResponse[]> => {
    return http.get<VawcAgencyReferralBreakdownResponse[]>('/api/v1/vawc/reports/agency-referrals', {
      params: { startDate, endDate },
    })
  },

  getMonthlyTrendReport: async (
    startDate?: string,
    endDate?: string
  ): Promise<MonthlyCaseTrendResponse[]> => {
    return http.get<MonthlyCaseTrendResponse[]>('/api/v1/vawc/reports/monthly-trend', {
      params: { startDate, endDate },
    })
  },

  getDailyTrendReport: async (
    startDate?: string,
    endDate?: string
  ): Promise<DailyCaseTrendResponse[]> => {
    return http.get<DailyCaseTrendResponse[]>('/api/v1/vawc/reports/daily-trend', {
      params: { startDate, endDate },
    })
  },

  getStatusBreakdownReport: async (
    startDate?: string,
    endDate?: string
  ): Promise<CaseStatusBreakdownResponse> => {
    return http.get<CaseStatusBreakdownResponse>('/api/v1/vawc/reports/status-breakdown', {
      params: { startDate, endDate },
    })
  },

  getReportRecords: async (
    startDate?: string,
    endDate?: string
  ): Promise<VawcTableRowResponse[]> => {
    return http.get<VawcTableRowResponse[]>('/api/v1/vawc/reports/records', {
      params: { startDate, endDate },
    })
  },

  // Archive & Trash Vault API Endpoints
  getArchiveKpi: async (): Promise<BlotterLifecycleKpiResponse> => {
    return http.get<BlotterLifecycleKpiResponse>('/api/v1/vawc/archive-kpi')
  },

  getArchivedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterArchiveItemResponse>> => {
    return http.get<PageResponse<BlotterArchiveItemResponse>>('/api/v1/vawc/archive-table', { params })
  },

  getRecentDeletedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterRecentDeleteItemResponse>> => {
    return http.get<PageResponse<BlotterRecentDeleteItemResponse>>('/api/v1/vawc/recent-delete', { params })
  },

  archiveCase: async (id: string | number, remarks?: string): Promise<void> => {
    return http.patch<void>(`/api/v1/vawc/archive-case/${id}`, { remarks: remarks || 'Archived Record' })
  },

  restoreArchivedCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(`/api/v1/vawc/${id}/restore-archive`)
  },

  softDeleteCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(`/api/v1/vawc/${id}/soft-delete`)
  },

  permanentDeleteCase: async (id: string | number): Promise<void> => {
    return http.delete<void>(`/api/v1/vawc/${id}/permanent-delete`)
  },
}
