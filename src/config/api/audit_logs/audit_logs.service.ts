import { axiosInstance } from '../axios.config'
import { ENDPOINTS } from '../endpoints.config'
import type {
  AuditLogListParams,
  AuditLogPageResponse,
  AuditLogStatsResponse,
} from './audit_logs.types'

export const auditLogsService = {
  async getAuditLogStats(): Promise<AuditLogStatsResponse> {
    const response = await axiosInstance.get<AuditLogStatsResponse>(
      ENDPOINTS.ROOTADMIN.AUDIT_LOGS_STATS
    )
    return response.data
  },

  async getAuditLogs(params?: AuditLogListParams): Promise<AuditLogPageResponse> {
    const response = await axiosInstance.get<AuditLogPageResponse>(
      ENDPOINTS.ROOTADMIN.AUDIT_LOGS,
      { params }
    )
    return response.data
  },
}
