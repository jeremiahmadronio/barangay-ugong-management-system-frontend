export interface AdminDashboardData {
  totalUsers: number
  totalResidents: number
  totalOfficers: number
  totalAuditEntries: number
  cpuUsage: number
  usedMemoryMb: number
  totalMemoryMb: number
  memoryUsagePercent: number
  diskFreeGb: number
  diskTotalGb: number
  diskUsagePercent: number
  healthStatus: string
  userTrend: Array<{
    month: string
    users: number
    residents: number
  }>
  recentActions: Array<{
    id: number
    user: string
    action: string
    module: string
    timestamp: string
  }>
}

export interface DepartmentWeeklyOverview {
  blotter: number
  lupon: number
  bcpc: number
  vawc: number
  clearance: number
  ftjs: number
  totalWeeklyOperations: number
}

export interface BarangayAdminDashboardKpiResponse {
  totalUsers: number
  totalResidents: number
  totalOfficers: number
  servicesIssuedThisWeek: number
  departmentOverview?: DepartmentWeeklyOverview
}

export interface ArchiveStatsResponse {
  totalArchived: number
  totalArchivedResidents: number
  totalArchivedOfficers: number
  totalArchivedUsers: number
  totalDeleted: number
  totalDeletedResidents: number
  totalDeletedOfficers: number
  totalDeletedUsers: number
}

export interface ArchivedResident {
  id: number
  fullName: string
  barangayId: string
  contact: string
  status: string
  deletedAt?: string
}

export interface ArchivedUser {
  id: string
  fullName: string
  email: string
  role: string
  departments: string
  status: string
  lastLogin: string
  deletedAt?: string
}

export interface ArchivedOfficer {
  id: number
  employee: string
  department: string
  position: string
  status: string
  statusRemarks: string
  deletedAt?: string
}
