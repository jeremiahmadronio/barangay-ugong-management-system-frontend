import { axiosInstance } from '@/config/api/axios.config'
import { ENDPOINTS } from '@/config/api/endpoints.config'

export const ftjsService = {
  getRequests: async () => {
    const response = await axiosInstance.get(ENDPOINTS.FTJS)
    return response.data
  },
}
