import { axiosInstance } from '../axios.config'
import type {
  KapitanaDashboardKpiResponse,
  KapitanaRecentCaseItem,
} from './kapitana.types'

export const kapitanaDashboardService = {
  getKpiStats: async (): Promise<KapitanaDashboardKpiResponse> => {
    const res = await axiosInstance.get<KapitanaDashboardKpiResponse>(
      '/api/v1/kapitana/dashboard-kpi'
    )
    return res.data
  },

  getRecentCases: async (limit = 10): Promise<KapitanaRecentCaseItem[]> => {
    const res = await axiosInstance.get<KapitanaRecentCaseItem[]>(
      `/api/v1/kapitana/recent-cases?limit=${limit}`
    )
    return res.data
  },
}

