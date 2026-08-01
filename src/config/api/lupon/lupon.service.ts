import { axiosInstance } from '@/config/api/axios.config'
import { ENDPOINTS } from '@/config/api/endpoints.config'

export const luponService = {
  getCases: async () => {
    const response = await axiosInstance.get(ENDPOINTS.LUPON)
    return response.data
  },
}
