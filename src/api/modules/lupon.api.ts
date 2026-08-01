import { http } from '../client'
import { ENDPOINTS } from '../endpoints'

export interface LuponRecord {
  id: string
  caseNo: string
  complainant: string
  respondent: string
  disputeType: string
  dateFiled: string
  status: string
}

export const luponApi = {
  getAll: async (): Promise<LuponRecord[]> => {
    return http.get<LuponRecord[]>(ENDPOINTS.LUPON.BASE)
  },

  getById: async (id: string | number): Promise<LuponRecord> => {
    return http.get<LuponRecord>(ENDPOINTS.LUPON.DETAIL(id))
  },

  create: async (data: Partial<LuponRecord>): Promise<LuponRecord> => {
    return http.post<LuponRecord>(ENDPOINTS.LUPON.BASE, data)
  },
}
