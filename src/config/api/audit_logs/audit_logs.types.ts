export type AuditLogSeverity = "INFO" | "WARNING" | "CRITICAL" | string;

export interface AuditLogResponse {
  id: number;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  ipAddress: string;
  severity: AuditLogSeverity;
  details: string;
  reason?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
}

export interface AuditLogStatsResponse {
  totalEntries: number;
  todayEntries: number;
  warningCount: number;
  criticalCount: number;
}

export interface AuditLogListParams {
  search?: string;
  severity?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface AuditLogPageResponse {
  content: AuditLogResponse[];
  pageNumber?: number;
  pageSize?: number;
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}
