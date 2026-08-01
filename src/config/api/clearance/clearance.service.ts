import { axiosInstance } from '@/config/api/axios.config'
import { ENDPOINTS } from '@/config/api/endpoints.config'

export const clearanceService = {
  getCertificates: async () => {
    const response = await axiosInstance.get(ENDPOINTS.CLEARANCE)
    return response.data
  },
}
