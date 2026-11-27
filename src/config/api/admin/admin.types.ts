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
