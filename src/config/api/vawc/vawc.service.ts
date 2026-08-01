import { axiosInstance } from '@/config/api/axios.config'
import { ENDPOINTS } from '@/config/api/endpoints.config'

export const vawcService = {
  getCases: async () => {
    const response = await axiosInstance.get(ENDPOINTS.VAWC)
    return response.data
  },
}
