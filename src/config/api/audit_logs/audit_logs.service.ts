import { http } from '../client'
import type {
  AuditLogListParams,
  AuditLogPageResponse,
  AuditLogStatsResponse,
} from './audit_logs.types'

export const auditLogsService = {
  getAuditLogStats: (): Promise<AuditLogStatsResponse> =>
    http.get<AuditLogStatsResponse>('/api/v1/audit-logs/stats'),

  getAuditLogs: (params?: AuditLogListParams): Promise<AuditLogPageResponse> =>
    http.get<AuditLogPageResponse>('/api/v1/audit-logs', { params }),
}
