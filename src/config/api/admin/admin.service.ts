import { axiosInstance } from '../axios.config'
import type {
  AdminDashboardData,
  BarangayAdminDashboardKpiResponse,
} from './admin.types'

export const adminDashboardService = {
  getStats: async (): Promise<AdminDashboardData> => {
    const response = await axiosInstance.get<AdminDashboardData>(
      '/api/v1/admin/dashboard/stats'
    )
    return response.data
  },
}

export const barangayAdminDashboardService = {
  getKpiStats: async (): Promise<BarangayAdminDashboardKpiResponse> => {
    try {
      const res = await axiosInstance.get<BarangayAdminDashboardKpiResponse>(
        '/api/v1/admin/dashboard/kpi'
      )
      return res.data
    } catch {
      return {
        totalUsers: 0,
        totalResidents: 0,
        totalOfficers: 0,
        servicesIssuedThisWeek: 0,
        departmentOverview: {
          blotter: 0,
          lupon: 0,
          bcpc: 0,
          vawc: 0,
          clearance: 0,
          ftjs: 0,
          totalWeeklyOperations: 0,
        },
      }
    }
  },
}
