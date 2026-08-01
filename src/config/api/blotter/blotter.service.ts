import { axiosInstance } from '@/config/api/axios.config'
import { ENDPOINTS } from '@/config/api/endpoints.config'

export const blotterService = {
  getEntries: async () => {
    const response = await axiosInstance.get(ENDPOINTS.BLOTTER)
    return response.data
  },
}
