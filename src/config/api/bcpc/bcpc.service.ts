import { axiosInstance } from '@/config/api/axios.config'
import { ENDPOINTS } from '@/config/api/endpoints.config'

export const bcpcService = {
  getCases: async () => {
    const response = await axiosInstance.get(ENDPOINTS.BCPC)
    return response.data
  },
}
