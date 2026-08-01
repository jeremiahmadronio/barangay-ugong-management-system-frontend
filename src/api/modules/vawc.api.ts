import { http } from '../client'
import { ENDPOINTS } from '../endpoints'

export interface VawcRecord {
  id: string
  caseNo: string
  victimName: string
  perpetratorName: string
  caseType: string
  dateFiled: string
  status: string
}

export const vawcApi = {
  getAll: async (): Promise<VawcRecord[]> => {
    return http.get<VawcRecord[]>(ENDPOINTS.VAWC.BASE)
  },

  getById: async (id: string | number): Promise<VawcRecord> => {
    return http.get<VawcRecord>(ENDPOINTS.VAWC.DETAIL(id))
  },

  create: async (data: Partial<VawcRecord>): Promise<VawcRecord> => {
    return http.post<VawcRecord>(ENDPOINTS.VAWC.BASE, data)
  },
}
