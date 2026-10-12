import { axiosInstance } from '../axios.config'
import { ENDPOINTS } from '../endpoints.config'

export interface BarangayAdminDashboardKpiResponse {
  totalUsers: number
  totalResidents: number
  totalOfficers: number
  servicesIssuedThisWeek: number
}

export const barangayAdminDashboardService = {
  getKpiStats: async (): Promise<BarangayAdminDashboardKpiResponse> => {
    try {
      const res = await axiosInstance.get<BarangayAdminDashboardKpiResponse>(
        ENDPOINTS.ADMIN.DASHBOARD_KPI
      )
      return res.data
    } catch {
      return {
        totalUsers: 0,
        totalResidents: 0,
        totalOfficers: 0,
        servicesIssuedThisWeek: 0,
      }
    }
  },
}
