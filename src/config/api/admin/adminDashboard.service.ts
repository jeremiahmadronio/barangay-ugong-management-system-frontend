import { axiosInstance } from '../axios.config'

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

export const adminDashboardService = {
  getStats: async (): Promise<AdminDashboardData> => {
    const response = await axiosInstance.get<AdminDashboardData>('/api/v1/admin/dashboard/stats')
    return response.data
  },
}
