import { http } from '../client'
import { axiosInstance } from '../axios.config'
import { blotterService } from '../blotter/blotter.service'
import type {
  PageResponse,
  BlotterBackendResponse,
  MonthlyCaseTrendResponse,
  DailyCaseTrendResponse,
  CaseStatusBreakdownResponse,
  BlotterLifecycleKpiResponse,
  BlotterArchiveItemResponse,
  BlotterRecentDeleteItemResponse,
  BlotterArchiveFilterParams,
  RecentBlotterCaseResponse,
  QuickMediationSummaryDto,
} from '../blotter/blotter.types'
import type {
  ConciliationSession,
  LuponDashboardKpiResponse,
  LuponFilterParams,
  LuponReportKpiResponse,
  LuponStatsResponse,
  LuponTableRowResponse,
  PanelAttendanceResponse,
  RecordConciliationMinutesPayload,
  ScheduleConciliationPayload,
} from './lupon.types'
import type { SessionFollowUp } from '../blotter/blotter.types'

export const luponService = {
  getCases: async (): Promise<unknown> => {
    const response = await axiosInstance.get<unknown>('/api/v1/lupon')
    return response.data
  },

  // Fetch paginated and filtered Lupon cases table
  getTable: async (
    params?: LuponFilterParams
  ): Promise<PageResponse<LuponTableRowResponse>> => {
    return http.get<PageResponse<LuponTableRowResponse>>('/api/v1/lupon/table', {
      params,
    })
  },

  // Fetch summary KPI statistics for Lupon module
  getStats: async (): Promise<LuponStatsResponse> => {
    return http.get<LuponStatsResponse>('/api/v1/lupon/stats')
  },

  // Fetch report KPI metrics within date range
  getReportKpi: async (params?: {
    startDate?: string
    endDate?: string
  }): Promise<LuponReportKpiResponse> => {
    return http.get<LuponReportKpiResponse>('/api/v1/lupon/report-kpi', { params })
  },

  // Fetch monthly case conciliation trend
  getMonthlyTrend: async (params?: {
    startDate?: string
    endDate?: string
  }): Promise<MonthlyCaseTrendResponse[]> => {
    return http.get<MonthlyCaseTrendResponse[]>('/api/v1/lupon/reports/monthly-trend', { params })
  },

  // Fetch daily case conciliation trend
  getDailyTrend: async (params?: {
    startDate?: string
    endDate?: string
  }): Promise<DailyCaseTrendResponse[]> => {
    return http.get<DailyCaseTrendResponse[]>('/api/v1/lupon/reports/daily-trend', { params })
  },

  // Fetch case status breakdown distribution
  getStatusBreakdown: async (params?: {
    startDate?: string
    endDate?: string
  }): Promise<CaseStatusBreakdownResponse> => {
    return http.get<CaseStatusBreakdownResponse>('/api/v1/lupon/reports/status-breakdown', { params })
  },

  // Fetch single case detail by ID (cases share underlying case model)
  getById: async (id: string | number): Promise<BlotterBackendResponse> => {
    return blotterService.getById(id)
  },

  // Update status (e.g. UNDER_CONCILIATION -> SETTLED or CFA_ISSUED)
  updateStatus: async (
    id: string | number,
    status: string,
    remarks?: string
  ): Promise<BlotterBackendResponse> => {
    return blotterService.updateStatus(id, status, remarks)
  },

  // Get assigned Pangkat members for a case
  getPangkatMembers: async (caseId: string | number): Promise<PanelAttendanceResponse[]> => {
    return http.get<PanelAttendanceResponse[]>(`/api/v1/lupon/${caseId}/pangkat`)
  },

  // Get Conciliation Sessions with Pangkat attendances
  getConciliationSessions: async (caseId: string | number): Promise<ConciliationSession[]> => {
    return http.get<ConciliationSession[]>(`/api/v1/lupon/${caseId}/conciliation`)
  },

  // Schedule Conciliation session
  scheduleConciliation: async (
    caseId: string | number,
    payload: ScheduleConciliationPayload
  ): Promise<ConciliationSession> => {
    return http.post<ConciliationSession>(`/api/v1/lupon/${caseId}/conciliation`, payload)
  },

  // Cancel Conciliation session
  cancelConciliation: async (sessionId: string | number): Promise<ConciliationSession> => {
    return http.patch<ConciliationSession>(`/api/v1/lupon/conciliation/${sessionId}/cancel`)
  },

  // Record Conciliation minutes
  recordMinutes: async (
    sessionId: string | number,
    payload: RecordConciliationMinutesPayload
  ): Promise<ConciliationSession> => {
    return http.post<ConciliationSession>(`/api/v1/lupon/conciliation/${sessionId}/minutes`, payload)
  },

  // Add follow-up remark to conciliation session
  addFollowUp: async (
    sessionId: string | number,
    payload: { remarks: string }
  ): Promise<SessionFollowUp> => {
    return http.post<SessionFollowUp>(`/api/v1/lupon/conciliation/${sessionId}/followup`, payload)
  },

  // Get follow-up remarks for conciliation session
  getFollowUps: async (sessionId: string | number): Promise<SessionFollowUp[]> => {
    return http.get<SessionFollowUp[]>(`/api/v1/lupon/conciliation/${sessionId}/followup`)
  },

  // Extend Lupon conciliation period by 15 days (one-time allowable extension)
  extendCase: async (caseId: string | number, reason: string): Promise<BlotterBackendResponse> => {
    return http.post<BlotterBackendResponse>(`/api/v1/lupon/${caseId}/extend`, { reason })
  },

  // Dashboard APIs
  getDashboardKpi: async (): Promise<LuponDashboardKpiResponse> => {
    return http.get<LuponDashboardKpiResponse>('/api/v1/lupon/dashboard-kpi')
  },

  getRecentCasesToday: async (): Promise<RecentBlotterCaseResponse[]> => {
    return http.get<RecentBlotterCaseResponse[]>('/api/v1/lupon/recent-cases-today')
  },

  getQuickTodayConciliations: async (): Promise<QuickMediationSummaryDto[]> => {
    return http.get<QuickMediationSummaryDto[]>('/api/v1/lupon/quick-today-conciliations')
  },

  // Archive & Trash Lifecycle APIs
  getArchiveKpi: async (): Promise<BlotterLifecycleKpiResponse> => {
    return http.get<BlotterLifecycleKpiResponse>('/api/v1/lupon/archive-kpi')
  },

  getArchivedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterArchiveItemResponse>> => {
    return http.get<PageResponse<BlotterArchiveItemResponse>>('/api/v1/lupon/archive-table', { params })
  },

  getRecentDeletedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterRecentDeleteItemResponse>> => {
    return http.get<PageResponse<BlotterRecentDeleteItemResponse>>('/api/v1/lupon/recent-delete-table', { params })
  },

  archiveCase: async (id: number | string, remarks?: string): Promise<void> => {
    return http.patch(`/api/v1/lupon/archive-case/${id}`, { remarks })
  },

  restoreArchivedCase: async (id: number | string): Promise<void> => {
    return http.patch(`/api/v1/lupon/${id}/restore-archive`)
  },

  softDeleteCase: async (id: number | string): Promise<void> => {
    return http.patch(`/api/v1/lupon/${id}/soft-delete`)
  },

  restoreDeletedCase: async (id: number | string): Promise<void> => {
    return http.patch(`/api/v1/lupon/${id}/restore-trash`)
  },

  permanentDeleteCase: async (id: number | string): Promise<void> => {
    return http.delete(`/api/v1/lupon/${id}/permanent-delete`)
  },
}
