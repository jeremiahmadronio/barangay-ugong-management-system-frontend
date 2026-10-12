import { axiosInstance } from '../axios.config'
import { ENDPOINTS } from '../endpoints.config'

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
